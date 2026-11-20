"use client";

import { discardUpload } from "@/app/admin/(dashboard)/blog/media-actions";
import { POST_LIMITS, type CoverImage } from "@/lib/blog-types";
import { coverUrl } from "@/lib/cloudinary/media";
import { Field } from "@/components/forms/field";
import type { PickedImage, PickOptions } from "@/components/admin/image-dialog";

/**
 * The cover image: shows it, opens the image popup to upload or replace it (progress and errors
 * appear in the popup), removes it, and edits its alt text.
 * `savedPublicId` is the cover stored on the post: any other cover shown here is an unsaved
 * upload, which is deleted from Cloudinary when it is replaced or removed.
 */
export function CoverPicker({
  cover,
  savedPublicId,
  error,
  onChange,
  pickImage,
}: {
  cover: CoverImage | null;
  savedPublicId: string | null;
  error?: string;
  onChange: (cover: CoverImage | null) => void;
  pickImage: (options: PickOptions) => Promise<PickedImage | null>;
}) {
  const dropUnsaved = (publicId: string | undefined) => {
    if (publicId && publicId !== savedPublicId) void discardUpload(publicId);
  };

  async function choose() {
    const picked = await pickImage({ kind: "cover" });
    if (!picked) return;
    dropUnsaved(cover?.publicId);
    onChange({ ...picked.image, alt: picked.alt || cover?.alt || "" });
  }

  return (
    // Two columns on wider screens: the preview, then its controls and alt text.
    <div className="grid gap-5 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary serves the sized image
        <img src={coverUrl(cover.publicId, 640)} alt="" className="aspect-[16/9] w-full rounded-2xl border border-ink/10 object-cover" />
      ) : (
        <button
          type="button"
          onClick={choose}
          className="grid aspect-[16/9] w-full place-items-center rounded-2xl border-2 border-dashed border-ink/15 text-[14px] font-semibold text-ink-soft transition-colors hover:border-mat hover:text-mat-deep"
        >
          Upload a cover image
        </button>
      )}

      <div className="space-y-4">
        <p className="text-[12.5px] text-ink-soft">JPG, PNG or WEBP, up to 5MB. Shown at 16:9, so 1600×900 or larger works best.</p>

        {cover ? (
          <div className="flex gap-3">
            <button type="button" onClick={choose} className="btn btn-ghost-light min-h-10">
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                dropUnsaved(cover.publicId);
                onChange(null);
              }}
              className="btn min-h-10 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        {cover ? (
          <Field
            name="coverAlt"
            label="Alt text"
            hint="Describe the image for people using screen readers."
            maxLength={POST_LIMITS.coverAlt}
            value={cover.alt}
            onChange={(event) => onChange({ ...cover, alt: event.target.value })}
          />
        ) : null}
      </div>
    </div>
  );
}
