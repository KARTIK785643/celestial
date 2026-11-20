/**
 * Blog shapes and limits shared by the server (lib/blog.ts, admin actions) and the
 * browser (the admin editor). Nothing here may import the MongoDB driver.
 */

export type PostStatus = "draft" | "published";

/** How the body was written: the visual/HTML editor ("rich") or Markdown. */
export type PostFormat = "rich" | "markdown";

/** A cover stored on Cloudinary. URLs are built from publicId (see lib/cloudinary/media.ts). */
export interface CoverImage {
  publicId: string;
  width: number;
  height: number;
  alt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  /** Shown on cards, under the title, and used as the meta description. */
  excerpt: string;
  /** The HTML the site renders — sanitised on save, never on render. For Markdown posts it is generated from `markdown`. */
  contentHtml: string;
  format: PostFormat;
  /** The Markdown source, kept so a Markdown post is edited as Markdown. Null for rich posts. */
  markdown: string | null;
  cover: CoverImage | null;
  category: string | null;
  tags: string[];
  /** Featured posts come first in "top posts" (homepage + "More articles"). */
  featured: boolean;
  /** Search-result title. Null → the post title (with the site name appended). */
  seoTitle: string | null;
  /** Search-result / link-preview description. Null → the summary (excerpt). */
  metaDescription: string | null;
  /** The phrase the post should rank for. Never published; only the editor's SEO checks use it. */
  focusKeyword: string | null;
  status: PostStatus;
  /** Set on first publish and kept after that, so republishing does not bump a post to the top. */
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Admin usernames. Null on posts written before authorship was recorded. */
  createdBy: string | null;
  updatedBy: string | null;
  readingMinutes: number;
}

/** Enforced on the server; the editor shows the same numbers. */
export const POST_LIMITS = {
  title: 120,
  slug: 80,
  excerpt: 220,
  category: 40,
  tag: 30,
  tagCount: 10,
  coverAlt: 160,
  seoTitle: 70,
  metaDescription: 200,
  focusKeyword: 60,
  contentHtml: 200_000,
} as const;
