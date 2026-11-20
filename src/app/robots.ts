import type { MetadataRoute } from "next";

export const dynamic = "force-static";

<<<<<<< HEAD
const base = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://celestialbadmintonacademy.com"
).replace(/\/+$/, "");
=======
const base = process.env.NEXT_PUBLIC_SITE_URL || "https://celestialbadmintonacademy.com/";
>>>>>>> 2e5bb2da01c56114268408d36b054c99a181f9d0

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${base}/sitemap.xml` };
}
