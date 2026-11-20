import Link from "next/link";

/** Page numbers to show: always the first, last, current and its neighbours, with gaps as null. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

/**
 * Previous / numbered pages / Next, as plain links (works without JavaScript).
 * Used by the public blog and the admin lists; renders nothing when there is only one page.
 */
export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;

  const item = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-[14px] font-semibold transition-colors";
  const idle = `${item} text-ink-soft ring-1 ring-inset ring-ink/15 hover:text-ink hover:ring-ink/30`;
  const off = `${item} text-ink-soft/40 ring-1 ring-inset ring-ink/10`;

  return (
    <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={idle}>
          ← Previous
        </Link>
      ) : (
        <span className={off} aria-hidden="true">
          ← Previous
        </span>
      )}

      {pageWindow(page, pageCount).map((n, i) =>
        n === null ? (
          <span key={`gap-${i}`} className="px-1 text-ink-soft" aria-hidden="true">
            …
          </span>
        ) : n === page ? (
          <span key={n} aria-current="page" className={`${item} bg-ink text-chalk`}>
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} aria-label={`Page ${n}`} className={idle}>
            {n}
          </Link>
        )
      )}

      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={idle}>
          Next →
        </Link>
      ) : (
        <span className={off} aria-hidden="true">
          Next →
        </span>
      )}
    </nav>
  );
}
