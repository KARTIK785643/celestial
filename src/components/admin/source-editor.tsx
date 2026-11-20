"use client";

import { useRef } from "react";
import { ImageSquare } from "@phosphor-icons/react";

/**
 * Plain-text editing of a post body as HTML or Markdown. "Insert image" opens the image popup
 * and puts the right snippet at the cursor. Whatever is typed here is sanitised on save (lib/blog.ts).
 */
export function SourceEditor({
  language,
  value,
  onChange,
  onInsertImage,
}: {
  language: "html" | "markdown";
  value: string;
  onChange: (value: string) => void;
  /** Opens the image popup; resolves with the image to insert, or null if cancelled. */
  onInsertImage: () => Promise<{ src: string; alt: string } | null>;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  async function insertImage() {
    // Read the cursor before the popup takes focus.
    const start = textarea.current?.selectionStart ?? value.length;
    const end = textarea.current?.selectionEnd ?? value.length;
    const image = await onInsertImage();
    if (!image) return;
    const snippet =
      language === "html"
        ? `\n<img src="${image.src}" alt="${image.alt.replace(/"/g, "&quot;")}">\n`
        : `\n![${image.alt.replace(/[[\]]/g, "")}](${image.src})\n`;
    onChange(value.slice(0, start) + snippet + value.slice(end));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-2">
        <p className="text-[12.5px] text-ink-soft">
          {language === "html"
            ? "Scripts, styles and images from other websites are removed when you save."
            : "Markdown: # headings, **bold**, *italic*, - lists, [link](url), > quote, | tables |."}
        </p>
        <button
          type="button"
          onClick={insertImage}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-ink-soft hover:bg-ink/[0.06] hover:text-ink"
        >
          <ImageSquare size={16} />
          Insert image
        </button>
      </div>
      <textarea
        ref={textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={language === "markdown"}
        aria-label={language === "html" ? "Post body as HTML" : "Post body as Markdown"}
        className="block min-h-[520px] w-full resize-y bg-chalk px-6 py-5 font-mono text-[13.5px] leading-relaxed text-ink outline-none sm:px-10"
      />
    </div>
  );
}
