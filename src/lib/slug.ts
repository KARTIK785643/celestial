import { POST_LIMITS } from "@/lib/blog-types";

/** "Smash Drills: 5 Tips!" → "smash-drills-5-tips". Used by the editor (live) and the server (authoritative). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, POST_LIMITS.slug)
    .replace(/-+$/, "");
}
