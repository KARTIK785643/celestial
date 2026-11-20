import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

// noindex comes from app/admin/layout.tsx.
export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  // Already signed in? Go straight to the posts.
  if (await verifySession()) redirect("/admin/blog");

  return (
    <section className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-[420px]">
        <p className="mb-6 text-center text-[15px] font-extrabold tracking-[-0.01em]">
          Celestial&rsquo;s <span className="font-semibold text-ink-soft">· Admin</span>
        </p>
        <LoginForm />
      </div>
    </section>
  );
}
