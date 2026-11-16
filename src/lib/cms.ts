export interface CmsImage {
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

export interface CmsAuthor {
    id?: string;
    name?: string;
    slug?: string;
    role?: string | null;
    bio?: string | null;
    avatar?: { src: string; alt: string } | null;
}

export interface CmsTag {
    label: string;
    slug: string;
}

export interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    description?: string;
    category: string | null;
    tags: CmsTag[];
    publishedAt: string;
    updatedAt: string;
    readingMinutes?: number;
    cover: CmsImage | null;
    author: CmsAuthor | null;
    // Detail-only fields (from /posts/:slug):
    body?: {
        kind: "editor" | "page";
        html: string;
    };
    faqs?: { question: string; answer: string }[];
}

function getCmsBaseUrl(): string {
    let url = (process.env.CMS_URL || "https://cms-website-mu.vercel.app").trim();
    url = url.replace(/\/+$/, "");
    if (!url.endsWith("/api/v1")) {
        url = `${url}/api/v1`;
    }
    return url;
}

export async function getPosts(params?: {
    page?: number;
    perPage?: number;
    tag?: string;
}): Promise<Post[]> {
    const baseUrl = getCmsBaseUrl();
    const siteKey = (process.env.CMS_SITE_KEY ?? "").trim();

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("perPage", String(params.perPage));
    if (params?.tag) searchParams.set("tag", params.tag);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    try {
        const res = await fetch(`${baseUrl}/posts${query}`, {
            headers: {
                Authorization: `Bearer ${siteKey}`,
                Accept: "application/json",
            },
            // tags: ['cms'] allows your webhook to instantly purge cache on publish
            next: { revalidate: 60, tags: ["cms"] },
        });

        if (!res.ok) {
            console.warn(`[CMS] Failed to fetch posts: HTTP ${res.status} (${res.statusText})`);
            if (res.status === 401) {
                console.warn("[CMS] 401 Unauthorized: Please check your CMS_SITE_KEY environment variable.");
            }
            return [];
        }

        const data = await res.json();

        // ✅ CRITICAL FIX: The CMS returns posts in `data.items`
        if (Array.isArray(data?.items)) {
            return data.items;
        }
        if (Array.isArray(data)) {
            return data;
        }
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
        const res = await fetch(`${baseUrl}/posts/${encodeURIComponent(slug)}`, {
            headers: {
                Authorization: `Bearer ${siteKey}`,
                Accept: "application/json",
            },
            next: { revalidate: 60, tags: ["cms"] },
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            console.warn(`[CMS] Failed to fetch post "${slug}": HTTP ${res.status}`);
            return null;
        }

        const data = await res.json();
        return data && data.title ? (data as Post) : null;
    } catch (err) {
        console.error(`[CMS] Error fetching post "${slug}":`, err);
        return null;
    }
}