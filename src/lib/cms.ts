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

function getCmsBaseUrl(): string {
  let url = (process.env.CMS_URL || "https://cms-website-mu.vercel.app/api/v1").trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, "");
  // Automatically ensure /api/v1 is present
  if (!url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }
  return url;
}

export async function getPosts(): Promise<Post[]> {
  const baseUrl = getCmsBaseUrl();
  const siteKey = (process.env.CMS_SITE_KEY ?? "").trim();

  try {
    const res = await fetch(`${baseUrl}/posts`, {
      headers: {
        Authorization: `Bearer ${siteKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[CMS] Failed to fetch posts from ${baseUrl}/posts: HTTP ${res.status} (${res.statusText})`);
      if (res.status === 401) {
        console.warn("[CMS] 401 Unauthorized: Please check your CMS_SITE_KEY environment variable.");
      }
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
  const baseUrl = getCmsBaseUrl();
  const siteKey = (process.env.CMS_SITE_KEY ?? "").trim();

  try {
    const res = await fetch(`${baseUrl}/posts/${slug}`, {
      headers: {
        Authorization: `Bearer ${siteKey}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`[CMS] Failed to fetch post "${slug}": HTTP ${res.status} (${res.statusText})`);
      return null;
    }

    const data = await res.json();
    return data?.post ?? data?.data ?? (data?.title ? data : null);
  } catch (err) {
    console.error(`[CMS] Error fetching post "${slug}":`, err);
    return null;
  }
}
