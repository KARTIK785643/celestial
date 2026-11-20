/**
 * Cloudinary helpers that are safe in the browser: upload rules and URL builders.
 * Server-only pieces (API secret, signing, deleting) live in ./server.ts.
 */

export type MediaKind = "cover" | "body";

/** An upload as the editor holds it before it is saved onto a post. */
export interface UploadedImage {
  publicId: string;
  width: number;
  height: number;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;
export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Checked in the browser before uploading; Cloudinary re-checks the format. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPT_ATTRIBUTE.split(",").includes(file.type.toLowerCase())) {
    return "Use a JPG, PNG or WEBP image.";
  }
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`;
  }
  return null;
}

/**
 * A delivery URL. The "v1" version segment marks where the transformation ends — without it,
 * a folder such as "cms_uploads" is misread as a transformation parameter ("cms_") and
 * Cloudinary answers 400.
 */
function deliveryUrl(transformation: string, publicId: string): string {
  return `${UPLOAD_BASE}${transformation}/v1/${publicId}`;
}

/** 16:9 cover, cropped around the subject, auto format + quality. */
export function coverUrl(publicId: string, width = 1280): string {
  return deliveryUrl(`f_auto,q_auto,c_fill,g_auto,ar_16:9,w_${width}`, publicId);
}

export function coverSrcSet(publicId: string): string {
  return [640, 960, 1280, 1920].map((w) => `${coverUrl(publicId, w)} ${w}w`).join(", ");
}

/** 1200×630 JPG for link previews (Open Graph / WhatsApp). */
export function ogImageUrl(publicId: string): string {
  return deliveryUrl("f_jpg,q_auto,c_fill,g_auto,w_1200,h_630", publicId);
}

/** Inline images inside a post body: never cropped, capped at 1600px wide. */
export function bodyImageUrl(publicId: string): string {
  return deliveryUrl("f_auto,q_auto,c_limit,w_1600", publicId);
}

/** True for images served from this site's Cloudinary account — the only images a post may embed. */
export function isOwnImageUrl(src: string): boolean {
  return Boolean(CLOUD_NAME) && src.startsWith(UPLOAD_BASE);
}

/** The public id inside one of our delivery URLs, or null. */
function publicIdFromUrl(src: string): string | null {
  if (!isOwnImageUrl(src)) return null;
  const parts = src.slice(UPLOAD_BASE.length).split("?")[0].split("/");
  // Drop the transformation segment ("f_auto,...") and an optional version ("v1234").
  const isTransformation = (part: string) => /^[a-z]{1,3}_[^,]+(,[a-z]{1,3}_[^,]+)*$/.test(part);
  const kept = parts.filter((part, i) => !(i === 0 && isTransformation(part)) && !/^v\d+$/.test(part));
  if (kept.length === 0) return null;
  kept[kept.length - 1] = kept[kept.length - 1].replace(/\.[a-z0-9]+$/i, "");
  return kept.join("/");
}

/** Every Cloudinary public id used by <img> tags in a post body. */
export function publicIdsInHtml(html: string): string[] {
  const ids = new Set<string>();
  for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const id = publicIdFromUrl(match[1].replace(/&amp;/g, "&"));
    if (id) ids.add(id);
  }
  return [...ids];
}
