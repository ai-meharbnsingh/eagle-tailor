import * as cookie from "cookie";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { shopUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  signPinSessionToken,
  verifyPinSessionToken,
  getPinCookieName,
} from "./pin-session";
import { getSessionCookieOptions } from "./lib/cookies";


const PIN_COOKIE = getPinCookieName();

export const pinAuthRouter = createRouter({
  login: publicQuery
    .input(z.object({ pin: z.string().regex(/^\d{6}$/) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const allUsers = await db
        .select()
        .from(shopUsers)
        .where(eq(shopUsers.isActive, true));

      // If no users exist, seed default owner
      if (allUsers.length === 0) {
        if (input.pin !== "223344") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
        }
        const hash = await bcryptjs.hash("223344", 10);
        const [{ id }] = await db
          .insert(shopUsers)
          .values({
            name: "Owner",
            pinHash: hash,
            role: "owner",
          })
          .$returningId();
        const newUser = await db.query.shopUsers.findFirst({
          where: eq(shopUsers.id, id),
        });
        if (!newUser) throw new Error("Failed to create default user");
        const token = await signPinSessionToken({
          shopUserId: newUser.id,
          name: newUser.name,
          role: newUser.role,
        });
        return {
          success: true,
          token,
          user: { id: newUser.id, name: newUser.name, role: newUser.role },
        };
      }

      // Find user with matching PIN
      let matchedUser = null;
      for (const u of allUsers) {
        if (await bcryptjs.compare(input.pin, u.pinHash)) {
          matchedUser = u;
          break;
        }
      }

      if (!matchedUser) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
      }

      const token = await signPinSessionToken({
        shopUserId: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
      });
      return {
        success: true,
        token,
        user: { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.get("cookie");
    if (!cookieHeader) return null;
    const cookies = cookie.parse(cookieHeader);
    const token = cookies[PIN_COOKIE];
    if (!token) return null;
    const payload = await verifyPinSessionToken(token);
    if (!payload) return null;
    return {
      id: payload.shopUserId,
      name: payload.name,
      role: payload.role,
    };
  }),

  changePin: authedQuery
    .input(
      z.object({
        currentPin: z.string().regex(/^\d{6}$/),
        newPin: z.string().regex(/^\d{6}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const shopUserId = ctx.shopUser?.id;
      if (!shopUserId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const user = await db.query.shopUsers.findFirst({
        where: eq(shopUsers.id, shopUserId),
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const valid = await bcryptjs.compare(input.currentPin, user.pinHash);
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Current PIN is incorrect" });

      const newHash = await bcryptjs.hash(input.newPin, 10);
      await db.update(shopUsers).set({ pinHash: newHash }).where(eq(shopUsers.id, shopUserId));
      return { success: true };
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(PIN_COOKIE, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
