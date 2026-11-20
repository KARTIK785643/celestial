"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { discardUpload } from "@/app/admin/(dashboard)/blog/media-actions";
import { ACCEPT_ATTRIBUTE, bodyImageUrl, coverUrl, type MediaKind, type UploadedImage } from "@/lib/cloudinary/media";
import { uploadImage } from "@/lib/cloudinary/upload-client";
import { Field } from "@/components/forms/field";

/** An uploaded image plus the alt text written for it. */
export type PickedImage = { image: UploadedImage; alt: string };

export type PickOptions = {
  /** "cover" previews the 16:9 crop; "body" is an image inside the post. */
  kind: MediaKind;
  /** A pasted/dropped file to start uploading straight away. */
  file?: File;
};

type Request = PickOptions & { resolve: (picked: PickedImage | null) => void };

/**
 * Every image upload in the admin in one popup: choose (or drop) a file, watch it upload, see
 * the preview, write the alt text, confirm. `pickImage()` resolves with the image, or null if
 * cancelled (the unused upload is deleted). Render `dialog` once in the component tree.
 */
export function useImageDialog(): { pickImage: (options: PickOptions) => Promise<PickedImage | null>; dialog: ReactNode } {
  const [request, setRequest] = useState<Request | null>(null);

  const pickImage = useCallback(
    (options: PickOptions) => new Promise<PickedImage | null>((resolve) => setRequest({ ...options, resolve })),
    []
  );

  const dialog = request ? (
    <ImageDialog
      kind={request.kind}
      initialFile={request.file}
      onDone={(picked) => {
        request.resolve(picked);
        setRequest(null);
      }}
    />
  ) : null;

  return { pickImage, dialog };
}

type Phase =
  | { step: "choose"; error?: string }
  | { step: "uploading"; progress: number; name: string }
  | { step: "ready"; image: UploadedImage };

function ImageDialog({
  kind,
  initialFile,
  onDone,
}: {
  kind: MediaKind;
  initialFile?: File;
  onDone: (picked: PickedImage | null) => void;
}) {
  const isCover = kind === "cover";
  const previewUrl = (publicId: string) => (isCover ? coverUrl(publicId, 960) : bodyImageUrl(publicId));
  const ref = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // A pasted/dropped file starts uploading straight away; otherwise the popup asks for one.
  const [phase, setPhase] = useState<Phase>(
    initialFile ? { step: "uploading", progress: 0, name: initialFile.name } : { step: "choose" }
  );
  const [alt, setAlt] = useState("");
  const [dragging, setDragging] = useState(false);

  /** Uploads and moves to "ready" (preview + alt text) or back to "choose" with the error. */
  async function runUpload(file: File) {
    const result = await uploadImage(file, kind, (progress) => setPhase({ step: "uploading", progress, name: file.name }));
    setPhase(result.ok ? { step: "ready", image: result.image } : { step: "choose", error: result.error });
  }

  function upload(file: File) {
    setPhase({ step: "uploading", progress: 0, name: file.name });
    void runUpload(file);
  }

  useEffect(() => {
    ref.current?.showModal();
    // A pasted/dropped file starts uploading once the popup is open (scheduled, not inline in the effect).
    const timer = initialFile ? window.setTimeout(() => void runUpload(initialFile)) : undefined;
    return () => window.clearTimeout(timer);
    // Runs once on open; the dialog is remounted for every new request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Leaving without inserting: the fresh upload is not used anywhere, so delete it. */
  function cancel() {
    if (phase.step === "uploading") return; // let the upload finish first
    if (phase.step === "ready") void discardUpload(phase.image.publicId);
    onDone(null);
  }

  function chooseAnother() {
    if (phase.step === "ready") void discardUpload(phase.image.publicId);
    setPhase({ step: "choose" });
    fileInput.current?.click();
  }

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      className="admin-fade m-auto w-[min(92vw,520px)] rounded-3xl border border-ink/10 bg-chalk p-7 text-ink shadow-xl backdrop:bg-court-950/50"
    >
      <h2 className="text-[20px] font-extrabold tracking-[-0.01em]">{isCover ? "Cover image" : "Add an image"}</h2>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload(file);
        }}
      />

      {phase.step === "choose" ? (
        <>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) upload(file);
            }}
            className={`mt-5 grid aspect-[16/9] w-full place-items-center rounded-2xl border-2 border-dashed text-center transition-colors ${
              dragging ? "border-mat bg-mat/5" : "border-ink/15 hover:border-mat"
            }`}
          >
            <span>
              <span className="block text-[15px] font-semibold">Choose an image</span>
              <span className="mt-1 block text-[13px] text-ink-soft">
                or drag it here · JPG, PNG or WEBP, up to 5MB{isCover ? " · shown at 16:9, 1600×900 or larger works best" : ""}
              </span>
            </span>
          </button>
          {phase.error ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
              Upload failed: {phase.error}
            </p>
          ) : null}
        </>
      ) : null}

      {phase.step === "uploading" ? (
        <div className="mt-5 grid aspect-[16/9] w-full place-items-center rounded-2xl bg-chalk-2 px-8" role="status">
          <div className="w-full">
            <p className="truncate text-[14px] font-semibold">Uploading {phase.name}…</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-mat transition-[width]" style={{ width: `${phase.progress}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-ink-soft">{phase.progress}%</p>
          </div>
        </div>
      ) : null}

      {phase.step === "ready" ? (
        <form
          id="image-dialog-form"
          onSubmit={(event) => {
            event.preventDefault();
            onDone({ image: phase.image, alt: alt.trim() });
          }}
          className="mt-5 space-y-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of the Cloudinary upload */}
          <img src={previewUrl(phase.image.publicId)} alt="" className="max-h-64 w-full rounded-2xl bg-chalk-2 object-contain" />
          <p className="text-[13px] font-semibold text-mat-deep">
            Uploaded. Describe it, then {isCover ? "use it as the cover" : "insert it into the post"}.
          </p>
          <Field
            name="image-alt"
            label="Alt text"
            hint="Read out by screen readers and used by Google. For example: Juniors practising footwork drills on court."
            value={alt}
            autoFocus
            onChange={(event) => setAlt(event.target.value)}
          />
        </form>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {phase.step === "ready" ? (
          <button type="button" onClick={chooseAnother} className="btn btn-ghost-light">
            Change image
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button type="button" onClick={cancel} disabled={phase.step === "uploading"} className="btn btn-ghost-light disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="image-dialog-form" disabled={phase.step !== "ready"} className="btn btn-primary disabled:opacity-50">
            {isCover ? "Use as cover" : "Insert image"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
