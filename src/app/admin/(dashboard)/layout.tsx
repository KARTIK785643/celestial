import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Login guard for every admin page except /admin/login (which sits outside this group).
 * Title + noindex come from app/admin/layout.tsx.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
