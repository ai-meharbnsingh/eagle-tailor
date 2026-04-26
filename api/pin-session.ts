import * as jose from "jose";
import { env } from "./lib/env";

const JWT_ALG = "HS256";
const PIN_COOKIE = "et_pin_sid";

export type PinSessionPayload = {
  shopUserId: number;
  name: string;
  role: string;
};

export async function signPinSessionToken(
  payload: PinSessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyPinSessionToken(
  token: string,
): Promise<PinSessionPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    const { shopUserId, name, role } = payload;
    if (!shopUserId || !name || !role) return null;
    return { shopUserId: Number(shopUserId), name, role } as PinSessionPayload;
  } catch {
    return null;
  }
}

export function getPinCookieName(): string {
  return PIN_COOKIE;
}
