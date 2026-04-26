import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { verifyPinSessionToken, getPinCookieName } from "./pin-session";
import * as cookie from "cookie";

export type PinUser = {
  id: number;
  name: string;
  role: string;
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  shopUser?: PinUser;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try OAuth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth auth optional
  }

  // Try PIN auth — Authorization header first (for HTTP/cross-origin), then cookie fallback
  try {
    let pinToken: string | null = null;
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      pinToken = authHeader.slice(7);
    } else {
      const cookieHeader = opts.req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader);
        pinToken = cookies[getPinCookieName()] ?? null;
      }
    }
    if (pinToken) {
      const payload = await verifyPinSessionToken(pinToken);
      if (payload) {
        ctx.shopUser = {
          id: payload.shopUserId,
          name: payload.name,
          role: payload.role,
        };
      }
    }
  } catch {
    // PIN auth optional
  }

  return ctx;
}
