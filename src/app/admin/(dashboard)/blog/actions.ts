"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { currentAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { getPostById, postsCollection, readingMinutes, sanitizePostHtml } from "@/lib/blog";
import { markdownToHtml } from "@/lib/markdown";
import { POST_LIMITS, type CoverImage, type PostFormat, type PostStatus } from "@/lib/blog-types";
import { publicIdsInHtml } from "@/lib/cloudinary/media";
import { destroyUnusedImages, isOwnedPublicId } from "@/lib/cloudinary/server";
import { slugify } from "@/lib/slug";

/** What the editor sends. Every field is re-checked here: the browser is not trusted. */
export type PostInput = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  format: PostFormat;
  /** Used when format is "rich" (visual editor or raw HTML). */
  contentHtml: string;
  /** Used when format is "markdown"; the server renders the HTML itself. */
  markdown: string;
  cover: CoverImage | null;
  category: string;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  intent: "save" | "publish" | "unpublish";
};

export type SaveResult =
  | { ok: true; id: string; slug: string; status: PostStatus; warning?: string }
  | { ok: false; errors: Record<string, string> };

const SESSION_EXPIRED = "Your session has expired. Sign in again.";
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function readCover(value: unknown): CoverImage | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const publicId = text(raw.publicId);
  if (!publicId || !isOwnedPublicId(publicId)) return null;
  return { publicId, width: Number(raw.width) || 0, height: Number(raw.height) || 0, alt: text(raw.alt) };
}

/** Refreshes every cached public page a post can appear on. (The sitemap is rendered per request.) */
function revalidatePublicPages(...slugs: string[]) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/page/[n]", "page"); // every listing page: a change can shift posts between pages
  for (const slug of new Set(slugs)) revalidatePath(`/blog/${slug}`);
}

export async function savePost(input: PostInput): Promise<SaveResult> {
  // The signed-in admin: the session check, and who is recorded as making the change.
  const admin = await currentAdmin();
  if (!admin) return { ok: false, errors: { form: SESSION_EXPIRED } };

  const title = text(input.title);
  const excerpt = text(input.excerpt);
  const category = text(input.category);
  const tags = [...new Set((Array.isArray(input.tags) ? input.tags : []).map(text).filter(Boolean))];
  const format: PostFormat = input.format === "markdown" ? "markdown" : "rich";
  const markdown = format === "markdown" && typeof input.markdown === "string" ? input.markdown : null;
  const source = markdown ?? (typeof input.contentHtml === "string" ? input.contentHtml : "");
  const cover = readCover(input.cover);
  const seoTitle = text(input.seoTitle);
  const metaDescription = text(input.metaDescription);
  const focusKeyword = text(input.focusKeyword);
  const intent = input.intent;

  const existing = input.id ? await getPostById(String(input.id)) : null;
  if (input.id && !existing) return { ok: false, errors: { form: "That post no longer exists." } };

  const status: PostStatus =
    intent === "publish" ? "published" : intent === "unpublish" ? "draft" : (existing?.status ?? "draft");
  // A draft may be half-written; the summary and body are only required once it is live.
  const goingLive = status === "published";

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Give the post a title.";
  else if (title.length > POST_LIMITS.title) errors.title = `Keep the title under ${POST_LIMITS.title} characters.`;
  if (!excerpt && goingLive) errors.excerpt = "Write a one or two sentence summary. It shows on cards and in search results.";
  else if (excerpt.length > POST_LIMITS.excerpt) errors.excerpt = `Keep the summary under ${POST_LIMITS.excerpt} characters.`;
  if (category.length > POST_LIMITS.category) errors.category = `Keep the category under ${POST_LIMITS.category} characters.`;
  if (tags.length > POST_LIMITS.tagCount) errors.tags = `Use at most ${POST_LIMITS.tagCount} tags.`;
  else if (tags.some((t) => t.length > POST_LIMITS.tag)) errors.tags = `Keep each tag under ${POST_LIMITS.tag} characters.`;
  if (input.cover && !cover) errors.cover = "That cover image is not valid. Upload it again.";
  if (cover && cover.alt.length > POST_LIMITS.coverAlt) errors.cover = `Keep the alt text under ${POST_LIMITS.coverAlt} characters.`;
  if (seoTitle.length > POST_LIMITS.seoTitle) errors.seoTitle = `Keep the SEO title under ${POST_LIMITS.seoTitle} characters.`;
  if (metaDescription.length > POST_LIMITS.metaDescription) {
    errors.metaDescription = `Keep the meta description under ${POST_LIMITS.metaDescription} characters.`;
  }
  if (focusKeyword.length > POST_LIMITS.focusKeyword) errors.focusKeyword = `Keep the focus keyword under ${POST_LIMITS.focusKeyword} characters.`;
  // Cap BEFORE rendering/sanitising, so a huge request cannot make the server do the work.
  if (source.length > POST_LIMITS.contentHtml) errors.content = "The post is too long to store. Split it in two.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const rawHtml = markdown !== null ? markdownToHtml(markdown) : source;

  const contentHtml = sanitizePostHtml(rawHtml);
  if (goingLive && !/<img/.test(contentHtml) && contentHtml.replace(/<[^>]*>/g, "").trim() === "") {
    return { ok: false, errors: { content: "Write the post before publishing it." } };
  }
  const droppedImages = (rawHtml.match(/<img/g)?.length ?? 0) - (contentHtml.match(/<img/g)?.length ?? 0);

  // The slug locks at first publish: a published URL may already be shared or indexed.
  const slug = existing?.publishedAt ? existing.slug : slugify(text(input.slug) || title);
  if (!slug) return { ok: false, errors: { slug: "The URL is empty. Use some letters or numbers." } };
  // "/blog/page/2/" is the listing's page 2, so no post may own the "page" URL.
  if (slug === "page") return { ok: false, errors: { slug: "“page” is reserved for the blog's page numbers. Use different words." } };

  const col = await postsCollection();
  const clash = await col.findOne(
    { slug, ...(existing ? { _id: { $ne: new ObjectId(existing.id) } } : {}) },
    { projection: { _id: 1 } }
  );
  if (clash) return { ok: false, errors: { slug: "Another post already uses this URL." } };

  const now = new Date();
  const doc = {
    slug,
    title,
    excerpt,
    contentHtml,
    format,
    markdown,
    cover,
    category: category || null,
    tags,
    featured: input.featured === true,
    seoTitle: seoTitle || null,
    metaDescription: metaDescription || null,
    focusKeyword: focusKeyword || null,
    status,
    publishedAt: existing?.publishedAt ?? (status === "published" ? now : null),
    updatedAt: now,
    updatedBy: admin,
    readingMinutes: readingMinutes(contentHtml),
  };

  let id: string;
  try {
    if (existing) {
      await col.updateOne({ _id: new ObjectId(existing.id) }, { $set: doc });
      id = existing.id;
    } else {
      id = String((await col.insertOne({ ...doc, createdAt: now, createdBy: admin })).insertedId);
    }
  } catch (error) {
    console.error("[admin] could not save post", error);
    return { ok: false, errors: { form: "Could not save. Try again, and check the server log." } };
  }

  // Images this edit stopped using: the old cover and any body images that were removed.
  if (existing) {
    const stillUsed = new Set(publicIdsInHtml(contentHtml));
    if (cover) stillUsed.add(cover.publicId);
    const before = [...publicIdsInHtml(existing.contentHtml), ...(existing.cover ? [existing.cover.publicId] : [])];
    await destroyUnusedImages(before.filter((publicId) => !stillUsed.has(publicId)), id);
  }

  revalidatePublicPages(slug, ...(existing ? [existing.slug] : []));

  await logActivity({
    actor: admin,
    action: intent === "publish" ? "published" : intent === "unpublish" ? "unpublished" : existing ? "saved" : "created",
    postId: id,
    postTitle: title,
  });

  return {
    ok: true,
    id,
    slug,
    status,
    warning:
      droppedImages > 0
        ? `${droppedImages} image${droppedImages === 1 ? " from another website was" : "s from other websites were"} removed. Upload images with the image button instead.`
        : undefined,
  };
}

export async function deletePost(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: SESSION_EXPIRED };

  const post = await getPostById(String(id));
  if (!post) return { ok: false, error: "That post no longer exists." };

  try {
    await (await postsCollection()).deleteOne({ _id: new ObjectId(post.id) });
  } catch (error) {
    console.error("[admin] could not delete post", error);
    return { ok: false, error: "Could not delete. Try again." };
  }

  await destroyUnusedImages([...publicIdsInHtml(post.contentHtml), ...(post.cover ? [post.cover.publicId] : [])]);
  revalidatePublicPages(post.slug);
  await logActivity({ actor: admin, action: "deleted", postId: post.id, postTitle: post.title });
  return { ok: true };
}
