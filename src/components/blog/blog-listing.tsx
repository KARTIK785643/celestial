import { notFound } from "next/navigation";
import { getPublishedPostsPage } from "@/lib/blog";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/blog/post-card";

/** Page 1 lives at /blog/, later pages at /blog/page/N/. */
export const blogPageHref = (page: number) => (page <= 1 ? "/blog/" : `/blog/page/${page}/`);

/** The public blog listing, shared by /blog (page 1) and /blog/page/[n]. Only the requested page is fetched. */
export async function BlogListing({ page }: { page: number }) {
  const { items: posts, pageCount } = await getPublishedPostsPage(page);
  if (page > 1 && posts.length === 0) notFound(); // past the last page

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Notes from the court"
        intro="Coaching tips, training advice and news from the academy."
      />
      <section className="bg-chalk-2 py-16 sm:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
          {posts.length === 0 ? (
            <p className="text-[1.05rem] text-ink-soft">No articles yet. Check back soon.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={page} pageCount={pageCount} href={blogPageHref} />
        </div>
      </section>
    </>
  );
}
