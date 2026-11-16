import type { Metadata } from "next";
import Link from "next/link";
import {
    CalendarDots,
    User,
    ArrowRight,
    Sparkle,
    WhatsappLogo,
    BookOpen,
} from "@phosphor-icons/react/ssr";
import { getPosts, type Post } from "@/lib/cms";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { ExternalButton, InternalButton } from "@/components/buttons";
import { trialLink, academy } from "@/lib/academy";

// Ensures Next.js revalidates the page on cache refreshes
export const revalidate = 60;

export const metadata: Metadata = {
    title: {
        absolute: "Badminton Blog & Articles | Celestial's Academy Noida",
    },
    description:
        "Explore training insights, equipment advice, player pathways, and news from Celestial's Badminton Academy in Sector 104, Noida.",
    alternates: { canonical: "/blog/" },
    openGraph: {
        title: "Badminton Blog & Articles | Celestial's Academy Noida",
        description:
            "Explore training insights, equipment advice, player pathways, and news from Celestial's Badminton Academy in Sector 104, Noida.",
        url: "/blog/",
    },
    twitter: {
        card: "summary_large_image",
        title: "Badminton Blog & Articles | Celestial's Academy Noida",
        description:
            "Explore training insights, equipment advice, player pathways, and news from Celestial's Badminton Academy in Sector 104, Noida.",
    },
};

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

export default async function BlogPage() {
    const posts = await getPosts();

    return (
        <>
            {/* Academy-styled Hero Header */}
            <PageHeader
                eyebrow="Academy Insights & Guides"
                title="Badminton Articles, Tips & Academy News"
                intro="Insights from our NIS-certified coaches, training drills, gear recommendations, and updates from Celestial's Badminton Academy in Sector 104, Noida."
            />

            <section
                aria-labelledby="articles-heading"
                className="on-light relative overflow-hidden bg-chalk py-16 sm:py-24"
            >
                <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
                    <div className="mb-12 flex flex-col items-start justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
                        <div>
                            <span className="eyebrow text-mat-deep">The Celestial Journal</span>
                            <h2
                                id="articles-heading"
                                className="display mt-2 text-[clamp(2.2rem,4vw,3.2rem)] text-ink"
                            >
                                Latest Publications
                            </h2>
                        </div>
                        <p className="max-w-md text-sm text-ink-soft sm:text-right">
                            Practical badminton techniques, fitness routines, and academy stories.
                        </p>
                    </div>

                    {posts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                            {posts.map((post: Post, idx: number) => {
                                const postUrl = `/blog/${post.slug}`;
                                const category = post.category || "Badminton Training";
                                const authorName = post.author?.name || "Celestial Coaching Team";

                                // ✅ 1. Safe image resolution: checks post.cover?.src from CMS
                                const imageUrl = post.cover?.src || (post as any).coverImage;
                                const imageAlt = post.cover?.alt || post.title;

                                // ✅ 2. Formatted date (e.g. "Nov 16, 2026")
                                const dateDisplay = formatDate(post.publishedAt || (post as any).date);

                                return (
                                    <Reveal key={post.id ?? post.slug ?? idx} delay={idx * 0.05}>
                                        <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[26px] bg-chalk-2 p-6 ring-1 ring-ink/10 transition-all duration-300 hover:-translate-y-1 hover:ring-mat-deep/40 hover:shadow-[0_16px_36px_-12px_rgba(10,20,25,0.18)]">
                                            {/* Glow on hover */}
                                            <div
                                                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mat/15 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-mat/25"
                                                aria-hidden="true"
                                            />

                                            <div>
                                                {/* Post Cover Image */}
                                                {imageUrl && (
                                                    <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-court-900">
                                                        <img
                                                            src={imageUrl}
                                                            alt={imageAlt}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}

                                                {/* Category & Meta */}
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <span className="eyebrow rounded-full bg-mat/15 px-3 py-1 text-[0.7rem] font-semibold text-mat-deep ring-1 ring-mat-deep/20">
                                                        {category}
                                                    </span>
                                                    {dateDisplay && (
                                                        <span className="flex items-center gap-1 text-xs text-ink-soft">
                                                            <CalendarDots size={13} weight="bold" />
                                                            {dateDisplay}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className="display-wide mt-4 text-xl font-bold leading-snug text-ink transition-colors duration-200 group-hover:text-mat-deep sm:text-2xl">
                                                    <Link href={postUrl} className="focus:outline-none">
                                                        {post.title}
                                                    </Link>
                                                </h3>

                                                {/* Excerpt */}
                                                {post.excerpt && (
                                                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Card Footer */}
                                            <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4">
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                                                    <User size={14} weight="bold" className="text-mat-deep" />
                                                    {authorName}
                                                </span>

                                                <Link
                                                    href={postUrl}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-mat-deep transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                                                >
                                                    Read
                                                    <ArrowRight size={14} weight="bold" />
                                                </Link>
                                            </div>
                                        </article>
                                    </Reveal>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty state when no posts are returned yet */
                        <div className="rounded-[28px] border-2 border-dashed border-ink/15 bg-chalk-2 p-10 text-center sm:p-16">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mat/20 text-mat-deep ring-1 ring-mat-deep/20">
                                <BookOpen size={28} weight="bold" />
                            </div>
                            <h3 className="display mt-5 text-2xl text-ink sm:text-3xl">
                                Articles Coming Soon
                            </h3>
                            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
                                We are currently crafting new training guides, coaching breakdowns, and academy stories. Check back soon or visit our training programs in Noida Sector 104.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                <InternalButton href="/programs/" variant="primary">
                                    Explore Coaching Programs
                                </InternalButton>
                                <ExternalButton href={trialLink()} variant="ink">
                                    Book a Free Trial Session
                                </ExternalButton>
                            </div>
                        </div>
                    )}

                    {/* Bottom Call to Action Section */}
                    <div className="mt-20 overflow-hidden rounded-[28px] bg-court-950 p-8 text-chalk shadow-xl sm:p-12 lg:p-16">
                        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
                            <div className="lg:col-span-8">
                                <span className="eyebrow flex items-center gap-2 text-mat-soft">
                                    <Sparkle size={16} weight="fill" />
                                    First Session Free
                                </span>
                                <h3 className="display mt-3 text-[clamp(2.2rem,4.5vw,3.6rem)] text-chalk">
                                    Want to practice what you read?
                                </h3>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-chalk/75 sm:text-lg">
                                    Join our training batches at Celestial&apos;s Badminton Academy in Sector 104, Noida. 7 indoor AC courts, NIS-certified coaches, and batches for all ages.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-end">
                                <ExternalButton
                                    href={trialLink()}
                                    variant="primary"
                                    className="w-full justify-center sm:w-auto"
                                >
                                    <WhatsappLogo size={18} weight="bold" className="mr-1 inline" />
                                    Book Free Trial
                                </ExternalButton>
                                <InternalButton
                                    href="/contact/"
                                    variant="ghost-dark"
                                    className="w-full justify-center sm:w-auto"
                                >
                                    Contact Academy
                                </InternalButton>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export { BlogPage };