import type { Metadata } from "next";
import { BlogListing } from "@/components/blog/blog-listing";

// Static at build, refreshed on demand: savePost/deletePost revalidate /blog and every /blog/page/N.
export const metadata: Metadata = {
  title: "Blog",
  description:
    "Badminton coaching tips, training advice and academy news from Celestial's Badminton Academy, Sector 104, Noida.",
  alternates: { canonical: "/blog/" },
};

export default function BlogIndexPage() {
  return <BlogListing page={1} />;
}
