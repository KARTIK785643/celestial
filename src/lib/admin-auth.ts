import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { ADMINS_COLLECTION, getDb, LOGIN_ATTEMPTS_COLLECTION } from "@/lib/mongodb";
import { readSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSessionToken } from "@/lib/admin-session";

// ---------------------------------------------------------------------------
// Admin accounts (created with scripts/add-admin.mjs) + session
// ---------------------------------------------------------------------------

/**
 * Compared against when the username does not exist, so a wrong username takes as long as a
 * wrong password and response timing does not reveal which usernames are real.
 */
const DUMMY_HASH = "$2b$12$AX1rKJiwOQ/k9s7qGseZguPXmWjkOkANYkWA.m1rKgIWE2/8NrmHC";

/** The canonical (lowercase) username if the credentials match an admin, otherwise null. */
export async function verifyCredentials(username: string, password: string): Promise<string | null> {
  const name = username.trim().toLowerCase();
  if (!name || !password) return null;
  const admin = await (await getDb()).collection(ADMINS_COLLECTION).findOne({ username: name });
  const hash = typeof admin?.passwordHash === "string" ? admin.passwordHash : DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);
  return admin && matches ? name : null;
}

export async function createSession(username: string): Promise<boolean> {
  const token = await signSessionToken(username);
  if (!token) return false;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure only in production: local dev is http, where a Secure cookie is dropped.
    secure: process.env.NODE_ENV === "production",
    // Lax: sent on normal navigation to /admin, never on cross-site POSTs (CSRF).
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return true;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * The signed-in admin's username, or null. Checks the account still exists, so removing an
 * admin (scripts/add-admin.mjs --remove) ends their access immediately, not when the cookie expires.
 */
export async function currentAdmin(): Promise<string | null> {
  const store = await cookies();
  const username = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!username) return null;
  const exists = await (await getDb()).collection(ADMINS_COLLECTION).countDocuments({ username }, { limit: 1 });
  return exists ? username : null;
}

export async function verifySession(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}

/**
 * The guard for every admin page (used by the dashboard layout). A visitor who is not signed in
 * gets the site's ordinary 404, not a redirect, so nothing reveals that an admin area exists.
 * Every server action checks the session itself as well.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await verifySession())) notFound();
}

// ---------------------------------------------------------------------------
// Login rate limiting: 5 failed attempts per IP per 15 minutes
// ---------------------------------------------------------------------------

const MAX_FAILURES = 5;
const WINDOW_SECONDS = 15 * 60;

declare global {
  var _cbaAttemptsIndex: Promise<unknown> | undefined;
}

async function attemptsCollection() {
  const db = await getDb();
  const col = db.collection(LOGIN_ATTEMPTS_COLLECTION);
  // TTL index: MongoDB deletes each failed attempt automatically after the window.
  if (!globalThis._cbaAttemptsIndex) {
    globalThis._cbaAttemptsIndex = col.createIndex(
      { at: 1 },
      { expireAfterSeconds: WINDOW_SECONDS },
    );
  }
  await globalThis._cbaAttemptsIndex;
  return col;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ?? // Netlify
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function loginAllowed(ip: string): Promise<boolean> {
  const col = await attemptsCollection();
  const failures = await col.countDocuments({ ip });
  return failures < MAX_FAILURES;
}

export async function recordFailedLogin(ip: string): Promise<void> {
  const col = await attemptsCollection();
  await col.insertOne({ ip, at: new Date() });
}

export async function clearFailedLogins(ip: string): Promise<void> {
  const col = await attemptsCollection();
  await col.deleteMany({ ip });
}
