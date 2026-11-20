import type { Metadata } from "next";
import { getUsedCategories } from "@/lib/blog";
import { PostEditor } from "@/components/admin/post-editor";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  return <PostEditor categories={await getUsedCategories()} />;
}
