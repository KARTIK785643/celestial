import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatPostDate, getPostById, getUsedCategories } from "@/lib/blog";
import { PostEditor } from "@/components/admin/post-editor";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([getPostById(id), getUsedCategories()]);
  if (!post) notFound();

  // Who did what, for the editor's Other details section (older posts have no author recorded).
  const by = (name: string | null) => (name ? ` by ${name}` : "");
  const history = [
    `Created ${formatPostDate(post.createdAt)}${by(post.createdBy)}`,
    ...(post.publishedAt ? [`First published ${formatPostDate(post.publishedAt)}`] : []),
    `Last updated ${formatPostDate(post.updatedAt)}${by(post.updatedBy)}`,
  ];

  return (
    <PostEditor
      // Remount when switching posts so no state carries over.
      key={post.id}
      categories={categories}
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentHtml: post.contentHtml,
        format: post.format,
        markdown: post.markdown,
        cover: post.cover,
        category: post.category ?? "",
        tags: post.tags,
        featured: post.featured,
        seoTitle: post.seoTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        focusKeyword: post.focusKeyword ?? "",
        status: post.status,
        everPublished: post.publishedAt !== null,
        history,
      }}
    />
  );
}
