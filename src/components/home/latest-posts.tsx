import Link from "next/link";
import { getTopPosts } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";
import { Reveal } from "@/components/reveal";

/** Homepage "top posts": featured first, then newest. Renders nothing if there are none or the DB is down. */
export async function LatestPosts() {
  const posts = await getTopPosts(4).catch((error) => {
    console.error("[home] top posts unavailable", error);
    return [];
  });
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="latest-posts-title" className="bg-chalk py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-ink-soft">From the blog</p>
            <h2 id="latest-posts-title" className="display mt-4 text-[clamp(2.4rem,4.5vw,4.2rem)] text-ink">
              Notes from the court
            </h2>
          </div>
          <div className="flex justify-end">
  <Link href="/blog/" className="btn btn-ghost-light">
    All articles
  </Link>
</div>
        </Reveal>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
