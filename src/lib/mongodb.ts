import { MongoClient, type Db } from "mongodb";

export const BLOG_COLLECTION = "blog_posts";
/** Admin accounts: { username, passwordHash }. Managed with scripts/add-admin.mjs. */
export const ADMINS_COLLECTION = "admins";
/** Who did what, when: sign-ins and post changes (lib/activity.ts). */
export const ACTIVITY_COLLECTION = "admin_activity";
export const LOGIN_ATTEMPTS_COLLECTION = "admin_login_attempts";

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

declare global {
  var _cbaMongo: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. See .env.example.");
  if (!globalThis._cbaMongo) {
    globalThis._cbaMongo = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    })
      .connect()
      .catch((error) => {
        // Don't cache a failed connection forever: let the next request retry.
        globalThis._cbaMongo = undefined;
        throw error;
      });
  }
  return globalThis._cbaMongo;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(process.env.MONGODB_DB || "celestial");
}
