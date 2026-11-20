"use server";

import { redirect } from "next/navigation";
import { sessionConfigured } from "@/lib/admin-session";
import {
  clearFailedLogins,
  clientIp,
  createSession,
  currentAdmin,
  destroySession,
  loginAllowed,
  recordFailedLogin,
  verifyCredentials,
} from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";

export type LoginState = { error?: string; username?: string };

/** One message for every wrong-credential case, so nothing reveals whether the username exists. */
const GENERIC = "That username and password did not match. Try again.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!sessionConfigured()) {
    console.error("[admin] login refused: SESSION_SECRET is not set (32+ characters). See .env.example.");
    return { error: "Login is not available. Check the server log.", username };
  }

  const ip = await clientIp();
  if (!(await loginAllowed(ip))) {
    return { error: "Too many attempts. Wait fifteen minutes and try again.", username };
  }

  const admin = await verifyCredentials(username, password);
  if (!admin) {
    await recordFailedLogin(ip);
    // The attempted name, trimmed, so the log shows who tried (it cannot be stuffed with long input).
    await logActivity({ actor: username.toLowerCase().slice(0, 64) || "(empty)", action: "sign-in-failed", detail: `IP ${ip}` });
    return { error: GENERIC, username };
  }

  await clearFailedLogins(ip);
  if (!(await createSession(admin))) {
    return { error: "Login is not available. Check the server log.", username };
  }
  await logActivity({ actor: admin, action: "signed-in", detail: `IP ${ip}` });

  // redirect() throws, so it must be the last thing.
  redirect("/admin/blog");
}

export async function logout(): Promise<void> {
  const admin = await currentAdmin();
  if (admin) await logActivity({ actor: admin, action: "signed-out" });
  await destroySession();
  redirect("/admin/login");
}
