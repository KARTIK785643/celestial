"use client";

import { Check, X } from "@phosphor-icons/react";
import { POST_LIMITS, type CoverImage } from "@/lib/blog-types";
import { SITE_URL } from "@/lib/site-url";
import { slugify } from "@/lib/slug";
import { Field } from "@/components/forms/field";

const SITE_NAME = "Celestial's Badminton Academy";

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value);

/** SEO title, meta description, focus keyword, a Google result preview and a checklist (as in the Zefract CMS). */
export function SeoPanel({
  title,
  slug,
  excerpt,
  bodyHtml,
  cover,
  tags,
  seoTitle,
  metaDescription,
  focusKeyword,
  errors,
  onSeoTitle,
  onMetaDescription,
  onFocusKeyword,
}: {
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  cover: CoverImage | null;
  tags: string[];
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  errors: Record<string, string>;
  onSeoTitle: (value: string) => void;
  onMetaDescription: (value: string) => void;
  onFocusKeyword: (value: string) => void;
}) {
  const effectiveTitle = seoTitle.trim() || title.trim();
  const description = metaDescription.trim() || excerpt.trim();
  const text = bodyHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  const keyword = focusKeyword.trim().toLowerCase();
  const has = (haystack: string) => keyword !== "" && haystack.toLowerCase().includes(keyword);

  const checks = [
    { label: "SEO title is 20 to 60 characters", pass: effectiveTitle.length >= 20 && effectiveTitle.length <= 60 },
    { label: "Description is 70 to 160 characters", pass: description.length >= 70 && description.length <= 160 },
    { label: `At least 300 words (now ${words})`, pass: words >= 300 },
    { label: "Uses headings to break up the text", pass: /<h[234][\s>]/i.test(bodyHtml) },
    { label: "Cover image has alt text", pass: Boolean(cover?.alt.trim()) },
    { label: "Has at least one tag", pass: tags.length > 0 },
    { label: "Focus keyword is set", pass: keyword !== "" },
    { label: "Keyword appears in the title", pass: has(effectiveTitle) },
    { label: "Keyword appears in the description", pass: has(description) },
    { label: "Keyword appears in the URL", pass: keyword !== "" && slug.includes(slugify(keyword)) },
    { label: "Keyword appears in the text", pass: has(text) },
  ];
  const passed = checks.filter((c) => c.pass).length;

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <Field
          name="seoTitle"
          label="SEO title"
          optional
          value={seoTitle}
          maxLength={POST_LIMITS.seoTitle}
          placeholder={title || "Defaults to the post title"}
          hint={`${seoTitle.length}/60 · Leave empty to use the post title followed by the site name.`}
          error={errors.seoTitle}
          onChange={(event) => onSeoTitle(event.target.value)}
        />
        <Field
          as="textarea"
          name="metaDescription"
          label="Meta description"
          optional
          rows={3}
          value={metaDescription}
          maxLength={POST_LIMITS.metaDescription}
          placeholder={excerpt || "Defaults to the summary"}
          hint={`${metaDescription.length}/160 · What Google and link previews show. Leave empty to use the summary.`}
          error={errors.metaDescription}
          onChange={(event) => onMetaDescription(event.target.value)}
          className="h-28 min-h-0 resize-none"
        />
        <Field
          name="focusKeyword"
          label="Focus keyword"
          optional
          value={focusKeyword}
          maxLength={POST_LIMITS.focusKeyword}
          placeholder="e.g. badminton coaching in Noida"
          hint="The phrase this post should rank for. Never published; the checks below use it."
          error={errors.focusKeyword}
          onChange={(event) => onFocusKeyword(event.target.value)}
        />
      </div>

      <div>
        <h3 className="eyebrow text-ink-soft">Google preview</h3>
        <div className="mt-3 rounded-2xl border border-ink/10 bg-chalk p-5 font-sans">
          <p className="truncate text-[13px] text-[#202124]">
            {SITE_URL.replace(/^https?:\/\//, "")} › blog › {slug || "…"}
          </p>
          <p className="mt-1 text-[19px] leading-snug text-[#1a0dab]">
            {clip(seoTitle.trim() || `${title.trim() || "Your post title"} · ${SITE_NAME}`, 60)}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#4d5156]">
            {description ? clip(description, 160) : "Your description appears here, under the title."}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="eyebrow text-ink-soft">SEO checklist</h3>
          <span className="text-[13px] font-semibold text-ink-soft">
            {passed}/{checks.length}
          </span>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-[14px]">
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                  check.pass ? "bg-mat/15 text-mat-deep" : "bg-ink/[0.06] text-ink-soft"
                }`}
              >
                {check.pass ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
              </span>
              <span className={check.pass ? "text-ink" : "text-ink-soft"}>{check.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
