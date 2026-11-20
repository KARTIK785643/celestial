import { v2 as cloudinary } from "cloudinary";
import { ObjectId } from "mongodb";
import { BLOG_COLLECTION, getDb } from "@/lib/mongodb";
import { ACCEPTED_FORMATS, type MediaKind } from "@/lib/cloudinary/media";

/**
 * Server-only Cloudinary access: signing uploads and deleting images.
 * Never import this from a client component — it reads CLOUDINARY_API_SECRET.
 */

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Every upload lands under this folder, and only assets under it may be deleted. */
const MEDIA_ROOT = (process.env.CLOUDINARY_FOLDER || "celestial-blog").replace(/^\/+|\/+$/g, "");

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/** True for an asset this admin uploaded. The trailing slash stops "celestial-blog-old/…" matching. */
export function isOwnedPublicId(publicId: string): boolean {
  return publicId.startsWith(`${MEDIA_ROOT}/`);
}

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
}

/** Parameters the browser needs to upload straight to Cloudinary without seeing the secret. */
export function signUploadParams(kind: MediaKind): SignedUpload {
  const folder = `${MEDIA_ROOT}/${kind === "cover" ? "covers" : "body"}`;
  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = ACCEPTED_FORMATS.join(",");
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats: allowedFormats },
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    timestamp,
    signature,
    folder,
    allowedFormats,
  };
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Deletes each image from Cloudinary unless another post still uses it.
 * `exceptPostId` is the post being saved/deleted, so its own (old) reference does not count.
 * Never throws: a failed delete leaves an orphaned file, not a broken page.
 */
export async function destroyUnusedImages(publicIds: string[], exceptPostId?: string): Promise<void> {
  if (!cloudinaryConfigured()) return;
  const db = await getDb();
  const posts = db.collection(BLOG_COLLECTION);
  const others = exceptPostId && ObjectId.isValid(exceptPostId) ? { _id: { $ne: new ObjectId(exceptPostId) } } : {};

  for (const publicId of new Set(publicIds)) {
    if (!isOwnedPublicId(publicId)) continue;
    try {
      const inUse = await posts.countDocuments({
        ...others,
        $or: [{ "cover.publicId": publicId }, { contentHtml: { $regex: escapeRegex(publicId) } }],
      });
      if (inUse > 0) continue;
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
      console.error("[media] could not delete %s", publicId, error);
    }
  }
}
