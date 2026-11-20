import type { PostStatus } from "@/lib/blog-types";

export function StatusPill({ status }: { status: PostStatus }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold ${
        published ? "bg-mat/15 text-mat-deep" : "bg-ink/[0.07] text-ink-soft"
      }`}
    >
      <span className={`size-1.5 rounded-full ${published ? "bg-mat" : "bg-ink-soft/60"}`} aria-hidden="true" />
      {published ? "Published" : "Draft"}
    </span>
  );
}
