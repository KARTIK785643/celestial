/** The site's public origin, without a trailing slash. Used where an absolute URL is required (sitemap, JSON-LD). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://celestialbadmintonacademy.com").replace(/\/+$/, "");
