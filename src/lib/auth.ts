import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "basis_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set to a long random string");
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function startSession(userId: string): Promise<void> {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId)
    .setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next = "/"): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireRole(roles: string[], next = "/"): Promise<SessionUser> {
  const u = await requireUser(next);
  if (!roles.includes(u.role)) redirect("/?denied=1");
  return u;
}
