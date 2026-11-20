import type { Metadata } from "next";
import Link from "next/link";
import { getActivityPage, type ActivityAction } from "@/lib/activity";
import { toPageNumber } from "@/lib/paginate";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = { title: "Activity" };

const LABELS: Record<ActivityAction, { text: string; tone: string }> = {
  "signed-in": { text: "Signed in", tone: "bg-ink/[0.07] text-ink-soft" },
  "sign-in-failed": { text: "Failed sign-in", tone: "bg-red-50 text-red-700" },
  "signed-out": { text: "Signed out", tone: "bg-ink/[0.07] text-ink-soft" },
  created: { text: "Created", tone: "bg-mat/15 text-mat-deep" },
  saved: { text: "Saved", tone: "bg-ink/[0.07] text-ink" },
  published: { text: "Published", tone: "bg-mat/15 text-mat-deep" },
  unpublished: { text: "Unpublished", tone: "bg-amber-50 text-amber-800" },
  deleted: { text: "Deleted", tone: "bg-red-50 text-red-700" },
};

// India time, whatever timezone the server runs in (Netlify runs in UTC).
const formatWhen = (date: Date) =>
  date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = toPageNumber((await searchParams).page);
  const { items: entries, pageCount, total } = await getActivityPage(page);

  return (
    <div className="admin-fade mx-auto w-full max-w-[1320px] px-5 pb-16 pt-4 sm:px-8">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Activity</h1>
      <p className="mt-1 text-[14px] text-ink-soft">Who did what, newest first: sign-ins and every change to a post.</p>

      {total === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-ink/15 bg-chalk p-12 text-center text-[15px] text-ink-soft">
          Nothing recorded yet.
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-ink-soft">There is no page {page}.</p>
      ) : (
        <ul className="mt-8 divide-y divide-ink/10 overflow-hidden rounded-3xl border border-ink/10 bg-chalk">
          {entries.map((entry) => {
            const label = LABELS[entry.action] ?? { text: entry.action, tone: "bg-ink/[0.07] text-ink-soft" };
            return (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 text-[14px]">
                <time dateTime={entry.at.toISOString()} className="w-44 shrink-0 text-ink-soft">
                  {formatWhen(entry.at)}
                </time>
                <span className="w-32 shrink-0 truncate font-semibold">{entry.actor}</span>
                <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[12px] font-semibold ${label.tone}`}>
                  {label.text}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {entry.postTitle ? (
                    entry.postId && entry.action !== "deleted" ? (
                      <Link href={`/admin/blog/${entry.postId}/edit/`} className="font-semibold text-ink hover:text-mat-deep">
                        {entry.postTitle}
                      </Link>
                    ) : (
                      <span className="text-ink-soft">{entry.postTitle}</span>
                    )
                  ) : null}
                  {entry.detail ? <span className="text-ink-soft">{entry.postTitle ? " · " : ""}{entry.detail}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} href={(n) => (n === 1 ? "/admin/activity/" : `/admin/activity/?page=${n}`)} />
    </div>
  );
}
