import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { getPinCookieName } from "./pin-session";
import { createRouter, publicQuery, authedQuery } from "./middleware";

export const authRouter = createRouter({
  me: publicQuery.query((opts) => {
    // Return OAuth user if available, otherwise return shopUser
    if (opts.ctx.user) {
      return opts.ctx.user;
    }
    if (opts.ctx.shopUser) {
      return opts.ctx.shopUser;
    }
    return null;
  }),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    // Clear both OAuth and PIN cookies
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(getPinCookieName(), "", {
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
