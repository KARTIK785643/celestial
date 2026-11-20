<<<<<<< HEAD
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
=======
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    CalendarDots,
    User,
    ArrowLeft,
    Clock,
    WhatsappLogo,
} from "@phosphor-icons/react/ssr";
import { getPostBySlug } from "@/lib/cms";
import { ExternalButton, InternalButton } from "@/components/buttons";
import { trialLink } from "@/lib/academy";

// Ensures Next.js revalidates the post page on cache refreshes
export const revalidate = 60;

interface PageProps {
    params: Promise<{ slug: string }>;
}

function formatDate(dateStr?: string | null): string | null {
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: "Article Not Found · Celestial's Badminton Academy",
        };
    }

    const title = `${post.title} | Celestial's Badminton Academy`;
    const description =
        post.excerpt ||
        post.description ||
        "Read the latest training insight and academy updates from Celestial's Badminton Academy in Sector 104, Noida.";

    // ✅ 1. Correct CMS cover image for SEO & OpenGraph
    const imageUrl = post.cover?.src;

    return {
        title: {
            absolute: title,
        },
        description,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `/blog/${slug}`,
            type: "article",
            images: imageUrl ? [{ url: imageUrl, alt: post.cover?.alt || post.title }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: imageUrl ? [imageUrl] : undefined,
        },
    };
}

export default async function ArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return (
            <section className="bg-court-950 py-32 text-center text-chalk sm:py-40">
                <div className="mx-auto max-w-xl px-5">
                    <span className="eyebrow text-mat-soft">404</span>
                    <h1 className="display mt-4 text-4xl sm:text-5xl">Article Not Found</h1>
                    <p className="mt-4 text-chalk/70">
                        The article you are looking for may have been moved or unpublished.
                    </p>
                    <div className="mt-8">
                        <InternalButton href="/blog/" variant="primary">
                            <ArrowLeft size={16} weight="bold" className="mr-1 inline" />
                            Back to all articles
                        </InternalButton>
                    </div>
                </div>
            </section>
        );
    }

    const authorName = post.author?.name || "Celestial Coaching Team";
    const authorRole = post.author?.role || "Certified Badminton Coach";
    const authorAvatar = post.author?.avatar?.src;

    // ✅ 2. Format publication date
    const dateDisplay = formatDate(post.publishedAt || (post as any).date);
    const category = post.category || "Academy Insights";

    // ✅ 3. Safely extract HTML content from any CMS field variation:
    const contentHtml =
        (typeof post.body === "string" ? post.body : post.body?.html) ||
        (post as any).bodyHtml ||
        (post as any).content ||
        (post as any).html ||
        "";

    // ✅ 4. Dynamic reading time from CMS
    const readingTime = post.readingMinutes ? `${post.readingMinutes} min read` : "4 min read";

    const coverUrl = post.cover?.src;
    const coverAlt = post.cover?.alt || post.title;

    return (
        <article className="overflow-hidden">
            {/* Article Header Hero */}
            <header className="relative bg-court-950 text-chalk">
                <div className="mx-auto max-w-[1000px] px-5 pb-16 pt-32 sm:px-8 sm:pt-40 lg:pb-20">
                    {/* Breadcrumb Navigation */}
                    <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-mat-soft">
                        <Link href="/" className="transition-colors hover:text-chalk">
                            Home
                        </Link>
                        <span aria-hidden="true" className="text-chalk/35">/</span>
                        <Link href="/blog/" className="transition-colors hover:text-chalk">
                            Blog
                        </Link>
                        <span aria-hidden="true" className="text-chalk/35">/</span>
                        <span className="truncate text-chalk/60">{post.title}</span>
                    </nav>

                    {/* Category Badge */}
                    <div className="mt-6">
                        <span className="eyebrow rounded-full bg-mat/15 px-3 py-1 text-xs font-semibold text-mat-soft ring-1 ring-mat/25">
                            {category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="display mt-5 text-[clamp(2.4rem,5.5vw,4.8rem)] leading-[0.95] text-chalk">
                        {post.title}
                    </h1>

                    {/* Excerpt if present */}
                    {post.excerpt && (
                        <p className="mt-6 text-lg leading-relaxed text-chalk/80 sm:text-xl">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Author & Date metadata bar */}
                    <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-chalk/15 pt-6 text-sm text-chalk/70">
                        <div className="flex items-center gap-2">
                            {authorAvatar ? (
                                <img
                                    src={authorAvatar}
                                    alt={authorName}
                                    className="h-8 w-8 rounded-full object-cover ring-1 ring-mat/30"
                                />
                            ) : (
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-mat/20 text-mat-soft ring-1 ring-mat/30">
                                    <User size={16} weight="bold" />
                                </span>
                            )}
                            <span className="font-medium text-chalk">{authorName}</span>
                        </div>

                        {dateDisplay && (
                            <div className="flex items-center gap-1.5">
                                <CalendarDots size={16} weight="bold" className="text-mat-soft" />
                                <span>{dateDisplay}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5">
                            <Clock size={16} weight="bold" className="text-mat-soft" />
                            <span>{readingTime}</span>
                        </div>

                        <div className="ml-auto">
                            <Link
                                href="/blog/"
                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-mat-soft transition-colors hover:text-chalk"
                            >
                                <ArrowLeft size={14} weight="bold" />
                                Back to all
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Article Content Section */}
            <section className="on-light bg-chalk py-14 sm:py-20">
                <div className="mx-auto max-w-[820px] px-5 sm:px-8">
                    {/* Featured Hero Image if available */}
                    {coverUrl && (
                        <div className="mb-12 overflow-hidden rounded-[24px] bg-chalk-2 ring-1 ring-ink/10 shadow-lg">
                            <img
                                src={coverUrl}
                                alt={coverAlt}
                                className="w-full object-cover max-h-[500px]"
                            />
                        </div>
                    )}

                    {/* Rich Content Area */}
                    <div
                        className="article-body text-[1.08rem] leading-[1.85] text-ink/90 
              [&_h2]:display-wide [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink sm:[&_h2]:text-3xl
              [&_h3]:display-wide [&_h3]:mt-9 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink sm:[&_h3]:text-2xl
              [&_p]:mb-6 [&_p]:leading-relaxed
              [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2
              [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2
              [&_li]:text-ink/85
              [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-mat [&_blockquote]:bg-chalk-2 [&_blockquote]:p-5 [&_blockquote]:italic [&_blockquote]:rounded-r-xl
              [&_a]:text-mat-deep [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-ink
              [&_img]:my-8 [&_img]:rounded-2xl [&_img]:w-full [&_img]:ring-1 [&_img]:ring-ink/10
              [&_strong]:font-semibold [&_strong]:text-ink
              [&_hr]:my-10 [&_hr]:border-ink/10"
                        dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />

                    {/* FAQs section if post has FAQs configured in CMS */}
                    {post.faqs && post.faqs.length > 0 && (
                        <div className="mt-14 rounded-2xl bg-chalk-2 p-6 ring-1 ring-ink/10 sm:p-8">
                            <h3 className="display-wide text-xl font-bold text-ink sm:text-2xl mb-6">
                                Frequently Asked Questions
                            </h3>
                            <div className="space-y-6">
                                {post.faqs.map((faq, i) => (
                                    <div key={i} className="border-b border-ink/10 pb-4 last:border-0 last:pb-0">
                                        <h4 className="font-semibold text-ink text-base sm:text-lg mb-2">
                                            {faq.question}
                                        </h4>
                                        <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Author Box */}
                    <div className="mt-14 flex items-center gap-4 rounded-2xl bg-chalk-2 p-6 ring-1 ring-ink/10">
                        {authorAvatar ? (
                            <img
                                src={authorAvatar}
                                alt={authorName}
                                className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-ink/10"
                            />
                        ) : (
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mat/20 text-mat-deep ring-1 ring-mat-deep/20">
                                <User size={24} weight="bold" />
                            </div>
                        )}
                        <div>
                            <span className="eyebrow text-xs text-mat-deep">Written by</span>
                            <h4 className="display-wide text-base font-bold text-ink sm:text-lg">
                                {authorName}
                            </h4>
                            <p className="text-xs text-ink-soft sm:text-sm">
                                {authorRole} · Celestial&apos;s Badminton Academy, Noida Sector 104.
                            </p>
                        </div>
                    </div>

                    {/* Navigation & Trial CTA */}
                    <div className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                        <InternalButton href="/blog/" variant="ghost-light">
                            <ArrowLeft size={16} weight="bold" className="mr-1.5 inline" />
                            All Articles
                        </InternalButton>

                        <ExternalButton href={trialLink()} variant="primary">
                            <WhatsappLogo size={18} weight="bold" className="mr-1 inline" />
                            Book Free Trial Session
                        </ExternalButton>
                    </div>
                </div>
            </section>
        </article>
    );
}
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0
