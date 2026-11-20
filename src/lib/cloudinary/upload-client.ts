import { signUpload } from "@/app/admin/(dashboard)/blog/media-actions";
import { validateImageFile, type MediaKind, type UploadedImage } from "@/lib/cloudinary/media";

export type UploadResult = { ok: true; image: UploadedImage } | { ok: false; error: string };

/**
 * Browser → Cloudinary upload with progress. The server only signs the request
 * (signUpload checks the admin session); the file goes straight to Cloudinary.
 */
export async function uploadImage(
  file: File,
  kind: MediaKind,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const problem = validateImageFile(file);
  if (problem) return { ok: false, error: problem };

  const signed = await signUpload(kind);
  if (!signed.ok) return signed;
  const { cloudName, apiKey, timestamp, signature, folder, allowedFormats } = signed.params;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("allowed_formats", allowedFormats);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          public_id?: string;
          width?: number;
          height?: number;
          error?: { message?: string };
        };
        if (xhr.status >= 200 && xhr.status < 300 && body.public_id) {
          resolve({ ok: true, image: { publicId: body.public_id, width: body.width ?? 0, height: body.height ?? 0 } });
        } else {
          resolve({ ok: false, error: body.error?.message ?? "Upload failed. Try again." });
        }
      } catch {
        resolve({ ok: false, error: "Upload failed. Try again." });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error during upload. Check your connection." });
    xhr.ontimeout = () => resolve({ ok: false, error: "The upload timed out. Try a smaller image." });
    xhr.send(form);
  });
}
