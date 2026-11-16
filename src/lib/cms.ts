export interface Post {
  id: string | number;
  slug: string;
  title: string;
  excerpt?: string;
  bodyHtml?: string;
  content?: string;
  coverImage?: string;
  image?: string;
  date?: string;
  publishedAt?: string;
  createdAt?: string;
  author?: {
    name?: string;
    avatar?: string;
    role?: string;
  };
  category?: string;
  tags?: string[];
}

const CMS_BASE_URL =
  process.env.CMS_URL || "https://cms-website-mu.vercel.app/api/v1";

export async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${CMS_BASE_URL}/posts`, {
      headers: {
        Authorization: `Bearer ${process.env.CMS_SITE_KEY ?? ""}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[CMS] Failed to fetch posts: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.posts)) return data.posts;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (err) {
    console.error("[CMS] Error fetching posts:", err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${CMS_BASE_URL}/posts/${slug}`, {
      headers: {
        Authorization: `Bearer ${process.env.CMS_SITE_KEY ?? ""}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[CMS] Failed to fetch post "${slug}": HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.post ?? data?.data ?? (data?.title ? data : null);
  } catch (err) {
    console.error(`[CMS] Error fetching post "${slug}":`, err);
    return null;
  }
}
