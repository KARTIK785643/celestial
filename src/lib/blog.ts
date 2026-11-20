import sanitizeHtml from "sanitize-html";
import { ObjectId, type Collection, type Document, type WithId } from "mongodb";
import { BLOG_COLLECTION, getDb, isDbConfigured } from "@/lib/mongodb";
import { isOwnImageUrl } from "@/lib/cloudinary/media";
import { paginate, type Page } from "@/lib/paginate";
import { slugify } from "@/lib/slug";
import type { BlogPost, CoverImage } from "@/lib/blog-types";

/**
 * Server-only blog data access. Public readers only ever see `status: "published"`.
 * The admin editor imports types from lib/blog-types.ts instead of this file.
 */

// ---------------------------------------------------------------------------
// HTML: sanitised once, on save
// ---------------------------------------------------------------------------

/**
 * What a post body may contain, whichever way it was written (visual editor, raw HTML or
 * Markdown). Scripts, styles, iframes, classes and inline styles are always removed.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h2", "h3", "h4", "strong", "em", "u", "s", "del", "a", "ul", "ol", "li", "blockquote",
    "code", "pre", "br", "hr", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    th: ["colspan", "rowspan", "align"],
    td: ["colspan", "rowspan", "align"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    // The post title is the page's only <h1>; deeper levels fold into h4.
    h1: "h2",
    h5: "h4",
    h6: "h4",
    // Links opening a new tab must not hand the opener to the other site.
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer nofollow" } : attribs,
    }),
    // Only our own Cloudinary images: no hotlinking, no tracking pixels.
    img: (tagName, attribs) => ({
      tagName,
      attribs: attribs.src && isOwnImageUrl(attribs.src) ? attribs : { ...attribs, src: "" },
    }),
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

export type Heading = { id: string; text: string; level: 2 | 3 };

const decodeEntities = (text: string) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/**
 * Gives every h2/h3 an id and returns them in order, for the post page's "On this page" list.
 * Done at render time, so stored content is untouched. (Sanitised headings carry no attributes.)
 */
export function withHeadingAnchors(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const anchored = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_match, level: string, inner: string) => {
    const text = decodeEntities(htmlToText(inner));
    const base = slugify(text) || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    headings.push({ id, text, level: level === "2" ? 2 : 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: anchored, headings };
}

/** ~200 words per minute, never less than 1. */
export function readingMinutes(html: string): number {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "21 Nov 2026" — one formatter for every page. */
export function formatPostDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------

declare global {
  var _cbaBlogIndexes: Promise<unknown> | undefined;
}

/** The posts collection, with its indexes created once per server process. */
export async function postsCollection(): Promise<Collection> {
  const col = (await getDb()).collection(BLOG_COLLECTION);
  globalThis._cbaBlogIndexes ??= Promise.all([
    col.createIndex({ slug: 1 }, { unique: true }),
    col.createIndex({ status: 1, featured: -1, publishedAt: -1 }), // top posts
    col.createIndex({ status: 1, publishedAt: -1 }), // public pages
    col.createIndex({ updatedAt: -1 }), // admin pages
  ]).catch((error) => {
    globalThis._cbaBlogIndexes = undefined;
    throw error;
  });
  await globalThis._cbaBlogIndexes;
  return col;
}

function toCover(value: unknown): CoverImage | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.publicId !== "string" || !raw.publicId) return null;
  return {
    publicId: raw.publicId,
    width: Number(raw.width) || 0,
    height: Number(raw.height) || 0,
    alt: typeof raw.alt === "string" ? raw.alt : "",
  };
}

function toPost(doc: WithId<Document>): BlogPost {
  return {
    id: String(doc._id),
    slug: String(doc.slug ?? ""),
    title: String(doc.title ?? ""),
    excerpt: String(doc.excerpt ?? ""),
    contentHtml: String(doc.contentHtml ?? ""),
    format: doc.format === "markdown" ? "markdown" : "rich",
    markdown: typeof doc.markdown === "string" ? doc.markdown : null,
    cover: toCover(doc.cover),
    category: typeof doc.category === "string" && doc.category ? doc.category : null,
    tags: Array.isArray(doc.tags) ? doc.tags.filter((t): t is string => typeof t === "string") : [],
    featured: doc.featured === true,
    seoTitle: typeof doc.seoTitle === "string" && doc.seoTitle ? doc.seoTitle : null,
    metaDescription: typeof doc.metaDescription === "string" && doc.metaDescription ? doc.metaDescription : null,
    focusKeyword: typeof doc.focusKeyword === "string" && doc.focusKeyword ? doc.focusKeyword : null,
    status: doc.status === "published" ? "published" : "draft",
    publishedAt: doc.publishedAt instanceof Date ? doc.publishedAt : null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(0),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(0),
    createdBy: typeof doc.createdBy === "string" ? doc.createdBy : null,
    updatedBy: typeof doc.updatedBy === "string" ? doc.updatedBy : null,
    readingMinutes: typeof doc.readingMinutes === "number" ? doc.readingMinutes : 1,
  };
}

const PUBLISHED = { status: "published" } as const;

// ---- Public (published only). An unconfigured DB renders an empty blog instead of failing the build.

/** Posts per page on the public /blog listing (a 3×3 grid). */
export const BLOG_PAGE_SIZE = 9;
/** Posts per page in the admin list. */
export const ADMIN_PAGE_SIZE = 20;

/** Every published post, newest first. Only the sitemap needs them all at once. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  if (!isDbConfigured()) return [];
  const docs = await (await postsCollection()).find(PUBLISHED).sort({ publishedAt: -1 }).toArray();
  return docs.map(toPost);
}

/** One page of published posts, newest first, for /blog and /blog/page/N. */
export async function getPublishedPostsPage(page: number): Promise<Page<BlogPost>> {
  if (!isDbConfigured()) return { items: [], page, pageCount: 1, total: 0 };
  return paginate(await postsCollection(), PUBLISHED, { publishedAt: -1, _id: -1 }, page, BLOG_PAGE_SIZE, toPost);
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  if (!isDbConfigured()) return null;
  const doc = await (await postsCollection()).findOne({ ...PUBLISHED, slug: String(slug) });
  return doc ? toPost(doc) : null;
}

/** Featured first, then newest. `excludeSlug` skips the post currently being read. */
export async function getTopPosts(limit = 4, excludeSlug?: string): Promise<BlogPost[]> {
  if (!isDbConfigured()) return [];
  const filter = excludeSlug ? { ...PUBLISHED, slug: { $ne: excludeSlug } } : PUBLISHED;
  const docs = await (await postsCollection())
    .find(filter)
    .sort({ featured: -1, publishedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toPost);
}

// ---- Admin (drafts included). Callers must have verified the session.

/** One page of all posts (drafts included), most recently updated first, plus the published count. */
export async function getAdminPostsPage(page: number): Promise<Page<BlogPost> & { publishedTotal: number }> {
  const col = await postsCollection();
  const [result, publishedTotal] = await Promise.all([
    paginate(col, {}, { updatedAt: -1, _id: -1 }, page, ADMIN_PAGE_SIZE, toPost),
    col.countDocuments(PUBLISHED),
  ]);
  return { ...result, publishedTotal };
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await postsCollection()).findOne({ _id: new ObjectId(id) });
  return doc ? toPost(doc) : null;
}

/** Categories already in use, offered as suggestions in the editor. */
export async function getUsedCategories(): Promise<string[]> {
  const values = await (await postsCollection()).distinct("category");
  return values.filter((v): v is string => typeof v === "string" && v.length > 0).sort();
}
