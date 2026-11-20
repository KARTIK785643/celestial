import { SignJWT, jwtVerify } from "jose";

/**
 * The admin session token: signing and reading, and nothing else.
 *
 * lib/admin-auth.ts builds on this (password checks, cookies, and confirming the admin still exists).
 *
 * The token is an HS256 JWT carrying the admin's username (`sub`). It proves who signed in;
 * lib/admin-auth.ts additionally checks the admin still exists, so deleting an admin revokes
 * them at once. Changing SESSION_SECRET signs everyone out.
 */

export const SESSION_COOKIE = "cba_admin";

/** Seven days. */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Null when SESSION_SECRET is missing or shorter than 32 characters: every check then fails closed. */
function secretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function sessionConfigured(): boolean {
  return secretKey() !== null;
}

export async function signSessionToken(username: string): Promise<string | null> {
  const key = secretKey();
  if (!key) return null;
  return new SignJWT({ role: "admin" })
    .setSubject(username)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

/** The username in a valid, unexpired admin token signed by this server, or null. */
export async function readSessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const key = secretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.role === "admin" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
