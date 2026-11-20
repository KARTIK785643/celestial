import type { Metadata } from "next";
import Link from "next/link";
import { formatPostDate, getAdminPostsPage } from "@/lib/blog";
import { toPageNumber } from "@/lib/paginate";
import { Pagination } from "@/components/pagination";
import { coverUrl } from "@/lib/cloudinary/media";
import { StatusPill } from "@/components/admin/status-pill";

export const metadata: Metadata = { title: "Posts" };

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = toPageNumber((await searchParams).page);
  const { items: posts, pageCount, total, publishedTotal } = await getAdminPostsPage(page);

  return (
    <div className="admin-fade mx-auto w-full max-w-[1320px] px-5 pb-16 pt-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Posts</h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            {total === 0 ? "No posts yet." : `${total} post${total === 1 ? "" : "s"} · ${publishedTotal} published`}
          </p>
        </div>
        <Link href="/admin/blog/new/" className="btn btn-primary">
          New post
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-ink/15 bg-chalk p-12 text-center">
          <p className="text-[16px] font-semibold">Write your first post</p>
          <p className="mt-1 text-[14px] text-ink-soft">Drafts stay private until you publish them.</p>
        </div>
      ) : posts.length === 0 ? null : (
        <ul className="mt-8 divide-y divide-ink/10 overflow-hidden rounded-3xl border border-ink/10 bg-chalk">
          {posts.map((post) => (
            <li key={post.id}>
              {/* The whole row opens the editor. */}
              <Link
                href={`/admin/blog/${post.id}/edit/`}
                className="group flex items-center gap-4 p-4 transition-colors hover:bg-chalk-2/60 sm:p-5"
              >
                {post.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Cloudinary serves the sized image
                  <img src={coverUrl(post.cover.publicId, 320)} alt="" className="hidden aspect-[16/9] w-28 shrink-0 rounded-xl object-cover sm:block" />
                ) : (
                  <div className="hidden aspect-[16/9] w-28 shrink-0 rounded-xl bg-chalk-2 sm:block" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold group-hover:text-mat-deep">{post.title || "Untitled"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
                    <StatusPill status={post.status} />
                    {post.featured ? <span className="font-semibold text-mat-deep">★ Featured</span> : null}
                    {post.category ? <span>{post.category}</span> : null}
                    <span>
                      Updated {formatPostDate(post.updatedAt)}
                      {post.updatedBy ? ` by ${post.updatedBy}` : ""}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && posts.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-ink-soft">There is no page {page}.</p>
      ) : null}
      <Pagination page={page} pageCount={pageCount} href={(n) => (n === 1 ? "/admin/blog/" : `/admin/blog/?page=${n}`)} />
    </div>
  );
}
