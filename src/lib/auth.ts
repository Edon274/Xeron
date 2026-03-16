import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";
import { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "xeron_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSecret() {
  return process.env.AUTH_SECRET ?? "xeron-dev-secret-change-me";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;
  const hashBuffer = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "utf8");
  const storedBuffer = Buffer.from(storedHash, "utf8");
  if (hashBuffer.length !== storedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, storedBuffer);
}

export function createSessionToken(userId: string) {
  const payload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function getUserIdFromToken(token: string | undefined | null) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { uid?: string; exp?: number };
    if (!payload.uid || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: NextRequest) {
  return getUserIdFromToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export function getUserIdFromCookieStore(cookieStore: { get: (name: string) => { value: string } | undefined }) {
  return getUserIdFromToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function getSessionCookieConfig() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
