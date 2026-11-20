"use server";

import { verifySession } from "@/lib/admin-auth";
import { cloudinaryConfigured, destroyUnusedImages, signUploadParams, type SignedUpload } from "@/lib/cloudinary/server";
import type { MediaKind } from "@/lib/cloudinary/media";

export type SignResult = { ok: true; params: SignedUpload } | { ok: false; error: string };

/** Signs a direct browser → Cloudinary upload. The file never passes through this server. */
export async function signUpload(kind: MediaKind): Promise<SignResult> {
  if (!(await verifySession())) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!cloudinaryConfigured()) {
    console.error("[media] uploads need NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET");
    return { ok: false, error: "Image uploads are not configured. Check the server log." };
  }
  return { ok: true, params: signUploadParams(kind === "body" ? "body" : "cover") };
}

/**
 * Deletes an upload the editor no longer wants (a cover replaced or removed before saving).
 * Kept if any saved post still uses it — savePost cleans up a saved post's old images itself.
 */
export async function discardUpload(publicId: string): Promise<void> {
  if (!(await verifySession())) return;
  await destroyUnusedImages([String(publicId)]);
}
