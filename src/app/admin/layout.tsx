import "./admin.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { currentAdmin } from "@/lib/admin-auth";
import { ProfileMenu } from "@/components/admin/profile-menu";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * The admin's own frame for everything under /admin. It renders inside the root layout's <main>;
 * admin.css hides the public header/footer around it. Signed in, a sticky 64px header holds only
 * the profile menu, aligned to the site's 1320px container; page toolbars stick below it (top-16).
 * Login PROTECTION is not here; it is in app/admin/(dashboard)/layout.tsx.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const username = await currentAdmin();
  if (!username) {
    return (
      <div data-admin-root className="min-h-dvh bg-chalk text-ink">
        {children}
      </div>
    );
  }

  return (
    <div data-admin-root className="min-h-dvh bg-chalk-2 text-ink">
      {/* Sticky, in the page colour so it reads as transparent while hiding content scrolling beneath it. */}
      <header className="sticky top-0 z-30 bg-chalk-2">
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-end px-5 sm:px-8">
          <ProfileMenu username={username} />
        </div>
      </header>
      {children}
    </div>
  );
}
