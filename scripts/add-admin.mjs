/**
 * Manage admin accounts (stored in MongoDB, collection "admins").
 *
 *   node --env-file=.env.local scripts/add-admin.mjs <username> "<password>"   add, or reset the password
 *   node --env-file=.env.local scripts/add-admin.mjs --remove <username>       remove (signs them out at once)
 *   node --env-file=.env.local scripts/add-admin.mjs --list                    list usernames
 *
 * Passwords are stored only as bcrypt hashes (cost 12), never in plain text.
 * Usernames are case-insensitive: 3 to 32 characters, letters, numbers, dot, dash or underscore.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";

const [first, second] = process.argv.slice(2);
const USAGE =
  'usage:\n  node --env-file=.env.local scripts/add-admin.mjs <username> "<password>"\n' +
  "  node --env-file=.env.local scripts/add-admin.mjs --remove <username>\n" +
  "  node --env-file=.env.local scripts/add-admin.mjs --list";

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Run with --env-file=.env.local (see .env.example).");
  process.exit(1);
}
if (!first) {
  console.error(USAGE);
  process.exit(1);
}

const client = await new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).connect();
const admins = client.db(process.env.MONGODB_DB || "celestial").collection("admins");
await admins.createIndex({ username: 1 }, { unique: true });

try {
  if (first === "--list") {
    const all = await admins.find({}, { projection: { username: 1, createdAt: 1 } }).sort({ username: 1 }).toArray();
    console.log(all.length ? all.map((a) => `- ${a.username}`).join("\n") : "No admins yet.");
  } else if (first === "--remove") {
    const username = String(second ?? "").trim().toLowerCase();
    if (!username) throw new Error(USAGE);
    const { deletedCount } = await admins.deleteOne({ username });
    console.log(deletedCount ? `Removed admin "${username}". They are signed out on their next request.` : `No admin named "${username}".`);
  } else {
    const username = first.trim().toLowerCase();
    const password = second ?? "";
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      throw new Error("Username must be 3 to 32 characters: letters, numbers, dot, dash or underscore.");
    }
    if (password.length < 12) {
      throw new Error(`That password is ${password.length} characters. The admin is a public URL: use at least 12.`);
    }
    const now = new Date();
    const result = await admins.updateOne(
      { username },
      { $set: { passwordHash: bcrypt.hashSync(password, 12), updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    console.log(result.upsertedCount ? `Created admin "${username}".` : `Updated the password for "${username}".`);

    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      console.log(
        "\nSESSION_SECRET is missing or too short. Add this line to .env.local (and the value to Netlify):\n" +
          `SESSION_SECRET="${randomBytes(32).toString("base64url")}"`
      );
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.close();
}
