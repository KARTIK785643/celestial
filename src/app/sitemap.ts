import type { MetadataRoute } from "next";
<<<<<<< HEAD
import { getPublishedPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";

/**
 * Rendered per request so it always matches what is published. (revalidatePath cannot refresh a
 * prerendered route handler that reads MongoDB directly; crawlers fetch this rarely, so it is cheap.)
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
=======

export const dynamic = "force-static";

const base = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://celestialbadmintonacademy.com"
).replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0
  const routes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "programs/", priority: 0.95, changeFrequency: "weekly" as const },
    { path: "facilities/", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "first-session/", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "pathway/", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "about/", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "contact/", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "gallery/", priority: 0.65, changeFrequency: "monthly" as const },
<<<<<<< HEAD
    { path: "blog/", priority: 0.7, changeFrequency: "weekly" as const },
  ];

  const posts = await getPublishedPosts().catch((error) => {
    console.error("[sitemap] posts unavailable", error);
    return [];
  });

  return [
    ...routes.map((r) => ({
      url: r.path ? `${SITE_URL}/${r.path}` : `${SITE_URL}/`,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}/`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
=======
  ];

  return routes.map((r) => ({
    url: r.path ? `${base}/${r.path}` : `${base}/`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0
