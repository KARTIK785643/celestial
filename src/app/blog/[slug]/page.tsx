import "@/app/blog.css";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, getPublishedPost, getTopPosts, withHeadingAnchors } from "@/lib/blog";
import { coverSrcSet, coverUrl, ogImageUrl } from "@/lib/cloudinary/media";
import { SITE_URL } from "@/lib/site-url";
import { PostCard } from "@/components/blog/post-card";

/**
 * No post is built at deploy time: each one renders on its first visit and is then cached,
 * until savePost/deletePost call revalidatePath for it. Unknown or draft slugs 404.
 */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug);
  if (!post) return {};
  const image = post.cover ? [{ url: ogImageUrl(post.cover.publicId), width: 1200, height: 630, alt: post.cover.alt }] : undefined;
  const description = post.metaDescription ?? post.excerpt;
  const shareTitle = post.seoTitle ?? post.title;
  return {
    // A custom SEO title is used exactly as written; otherwise the site name is appended by the root layout.
    title: post.seoTitle ? { absolute: post.seoTitle } : post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}/` },
    openGraph: {
      type: "article",
      title: shareTitle,
      description,
      url: `/blog/${post.slug}/`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      images: image,
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: image?.map((i) => i.url) },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedPost((await params).slug);
  if (!post) notFound();

  const more = await getTopPosts(3, post.slug);
  const { html, headings } = withHeadingAnchors(post.contentHtml);
  const url = `${SITE_URL}/blog/${post.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    image: post.cover ? ogImageUrl(post.cover.publicId) : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: url,
    url,
    keywords: post.tags.join(", ") || undefined,
    author: { "@type": "Organization", name: "Celestial's Badminton Academy", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Celestial's Badminton Academy", logo: `${SITE_URL}/images/LOGO.png` },
  };

  return (
    <>
      <article>
        <header className="bg-court-950 text-chalk">
          <div className="mx-auto max-w-[1320px] px-5 pb-14 pt-32 sm:px-8 sm:pt-40">
            <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-mat-soft">
              <Link href="/" className="transition-colors hover:text-chalk">Home</Link>
              <span aria-hidden="true" className="text-chalk/35">/</span>
              <Link href="/blog/" className="transition-colors hover:text-chalk">Blog</Link>
              {post.category ? (
                <>
                  <span aria-hidden="true" className="text-chalk/35">/</span>
                  <span>{post.category}</span>
                </>
              ) : null}
            </nav>
            <h1 className="mt-5 max-w-[22ch] text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[1.06] tracking-[-0.02em]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-[60ch] text-[1.1rem] leading-relaxed text-chalk/75">{post.excerpt}</p>
            <p className="mt-6 text-[14px] text-chalk/60">
              {post.publishedAt ? <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time> : null}
              {" · "}
              {post.readingMinutes} min read
            </p>
          </div>
        </header>

        <div className="bg-chalk pb-16 sm:pb-20">
          {/* Same 1320px container as the rest of the site; the text column stays ~800px for readable line length. */}
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            {post.cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary serves sized, auto-format images
              <img
                src={coverUrl(post.cover.publicId, 1920)}
                srcSet={coverSrcSet(post.cover.publicId)}
                sizes="(min-width: 1320px) 1256px, 100vw"
                alt={post.cover.alt}
                fetchPriority="high"
                className="aspect-[16/9] w-full object-cover sm:mt-10 sm:rounded-3xl lg:aspect-[21/9]"
              />
            ) : null}

            {/* Article + sticky "On this page" list on desktop; on mobile the list comes first. */}
            <div className={`mt-12 grid gap-10 ${headings.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16" : ""}`}>
              {headings.length > 0 ? (
                <aside className="h-fit lg:sticky lg:top-28 lg:order-2">
                  <nav aria-label="On this page" className="rounded-3xl border border-ink/10 bg-chalk-2 p-6">
                    <p className="eyebrow text-ink-soft">On this page</p>
                    <ol className="mt-3 space-y-0.5 text-[15px] leading-snug">
                      {headings.map((heading) => (
                        <li key={heading.id} className={heading.level === 3 ? "pl-4" : ""}>
                          <a
                            href={`#${heading.id}`}
                            className={`block rounded-lg py-1.5 transition-colors hover:text-mat-deep ${
                              heading.level === 2 ? "font-semibold text-ink" : "text-ink-soft"
                            }`}
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </aside>
              ) : null}

              <div className="min-w-0 lg:order-1">
                <div className="blog-prose blog-prose-lg" dangerouslySetInnerHTML={{ __html: html }} />

                {post.tags.length > 0 ? (
                  <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
                    {post.tags.map((tag) => (
                      <li key={tag} className="rounded-full bg-chalk-2 px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft">
                        #{tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>

      {more.length > 0 ? (
        <section aria-labelledby="more-articles-title" className="bg-chalk-2 py-16 sm:py-20">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <p className="eyebrow text-ink-soft">Keep reading</p>
            <h2 id="more-articles-title" className="display mt-4 text-[clamp(2.2rem,4vw,3.6rem)] text-ink">
              More articles
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
