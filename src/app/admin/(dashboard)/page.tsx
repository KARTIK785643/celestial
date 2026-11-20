import { redirect } from "next/navigation";

/** /admin has no page of its own: go to the posts. */
export default function AdminHome() {
  redirect("/admin/blog");
}
