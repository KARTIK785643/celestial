import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListing, blogPageHref } from "@/components/blog/blog-listing";

/**
 * /blog/page/2/, /blog/page/3/ … Each renders on first visit and is then cached until a post
 * changes (savePost/deletePost revalidate "/blog/page/[n]"). Page 1 is /blog/ itself.
 */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ n: string }> };

/** Only plain numbers from 2 up; "1", "01" or "abc" are not pages. */
function parsePage(n: string): number | null {
  return /^[1-9]\d*$/.test(n) && Number(n) >= 2 ? Number(n) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).n);
  if (!page) return {};
  return {
    title: `Blog, page ${page}`,
    description: `Badminton coaching tips and academy news from Celestial's Badminton Academy, Noida. Page ${page}.`,
    alternates: { canonical: blogPageHref(page) },
  };
}

export default async function BlogPagedPage({ params }: Props) {
  const page = parsePage((await params).n);
  if (!page) notFound();
  return <BlogListing page={page} />;
}
