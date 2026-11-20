"use client";

import "@/app/blog.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import TurndownService from "turndown";
import { deletePost, savePost, type PostInput } from "@/app/admin/(dashboard)/blog/actions";
import { POST_LIMITS, type CoverImage, type PostFormat, type PostStatus } from "@/lib/blog-types";
import { bodyImageUrl } from "@/lib/cloudinary/media";
import { markdownToHtml } from "@/lib/markdown";
import { slugify } from "@/lib/slug";
import { Field } from "@/components/forms/field";
import { CoverPicker } from "@/components/admin/cover-picker";
import { EditorToolbar } from "@/components/admin/editor-toolbar";
import { useImageDialog } from "@/components/admin/image-dialog";
import { usePrompt } from "@/components/admin/prompt-dialog";
import { SeoPanel } from "@/components/admin/seo-panel";
import { SourceEditor } from "@/components/admin/source-editor";
import { StatusPill } from "@/components/admin/status-pill";
import { useStatusDialog } from "@/components/admin/status-dialog";

/** The post as the editor needs it (plain, serialisable: passed from a Server Component). */
export type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  format: PostFormat;
  markdown: string | null;
  cover: CoverImage | null;
  category: string;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  status: PostStatus;
  /** True once ever published: the URL is then locked. */
  everPublished: boolean;
  /** Ready-to-show lines such as "Last updated 20 Nov 2026 by saquib". */
  history: string[];
};

type Intent = PostInput["intent"];
/** Visual and HTML edit the same HTML; Markdown is stored as Markdown. */
type Mode = "visual" | "html" | "markdown";

const MODES: { id: Mode; label: string }[] = [
  { id: "visual", label: "Visual" },
  { id: "html", label: "HTML" },
  { id: "markdown", label: "Markdown" },
];

/** Editor sections, one shown at a time. `fields` maps server errors to the section that holds them. */
const SECTIONS = [
  { id: "content", label: "Content", fields: ["title", "slug", "excerpt", "cover", "content"] },
  { id: "details", label: "Other details", fields: ["category", "tags"] },
  { id: "seo", label: "SEO", fields: ["seoTitle", "metaDescription", "focusKeyword"] },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

/** HTML the visual editor cannot represent (it would drop it), so such posts open in HTML mode. */
const BEYOND_VISUAL = /<(table|h4|figure)\b/i;

const CARD = "rounded-3xl border border-ink/10 bg-chalk";

const htmlToMarkdown = (html: string) =>
  new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" }).turndown(html);

function initialMode(post?: EditorPost): Mode {
  if (post?.format === "markdown") return "markdown";
  return post && BEYOND_VISUAL.test(post.contentHtml) ? "html" : "visual";
}

export function PostEditor({ post, categories }: { post?: EditorPost; categories: string[] }) {
  const router = useRouter();

  const [section, setSection] = useState<SectionId>("content");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  // A new post's URL follows its title until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [mode, setMode] = useState<Mode>(() => initialMode(post));
  const [htmlSource, setHtmlSource] = useState(post?.contentHtml ?? "");
  const [markdown, setMarkdown] = useState(post?.markdown ?? "");
  const [markdownPreview, setMarkdownPreview] = useState(false);
  const [cover, setCover] = useState<CoverImage | null>(post?.cover ?? null);
  const [savedCoverId, setSavedCoverId] = useState<string | null>(post?.cover?.publicId ?? null);
  const [category, setCategory] = useState(post?.category ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focusKeyword ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [slugLocked, setSlugLocked] = useState(post?.everPublished ?? false);

  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const editorRef = useRef<Editor | null>(null);
  const { ask, dialog: promptDialog } = usePrompt();
  const { pickImage, dialog: imageDialog } = useImageDialog();
  // Save/publish/unpublish/delete progress and results are shown in this popup, not on the buttons.
  const status$ = useStatusDialog();

  /** Wraps a setter so any edit marks the form as unsaved. */
  const edit =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setDirty(true);
    };

  /** Opens the image popup for an image inside the post; resolves with its URL and alt text. */
  async function pickBodyImage(file?: File) {
    const picked = await pickImage({ kind: "body", file });
    return picked ? { src: bodyImageUrl(picked.image.publicId), alt: picked.alt } : null;
  }

  /**
   * Visual mode: opens the image popup (upload, preview, alt text) and inserts the result at the
   * cursor. Called by the toolbar button (no file yet) and by paste/drop (one popup per file).
   */
  async function insertImages(files: (File | undefined)[]) {
    for (const file of files) {
      const image = await pickBodyImage(file);
      if (image) editorRef.current?.chain().focus().setImage(image).run();
    }
  }

  const imageFiles = (list: FileList | null | undefined) =>
    Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The post title is the page's <h1>, so the body starts at <h2>.
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image,
      Placeholder.configure({ placeholder: "Write your post… Paste or drop images to upload them." }),
    ],
    content: post?.format === "markdown" ? "" : (post?.contentHtml ?? ""),
    immediatelyRender: false, // avoids a server/client hydration mismatch
    editorProps: {
      attributes: { class: "blog-prose tiptap-surface", "aria-label": "Post body" },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length === 0) return false;
        void insertImages(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = imageFiles((event as DragEvent).dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
    onUpdate: () => setDirty(true),
  });

  // Paste/drop handlers are created before the editor exists, so they reach it through this ref.
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** The body as HTML, whichever mode is active. */
  function currentHtml(): string {
    if (mode === "visual") return editor?.getHTML() ?? "";
    if (mode === "html") return htmlSource;
    return markdownToHtml(markdown);
  }

  /** Carries the body across when switching mode. Visual and HTML are lossless for what Visual supports. */
  function switchMode(next: Mode) {
    if (next === mode || !editor) return;
    const html = currentHtml();
    if (next === "visual") editor.commands.setContent(html, { emitUpdate: false });
    if (next === "html") setHtmlSource(html);
    if (next === "markdown") setMarkdown(htmlToMarkdown(html));
    // Moving between Markdown and the HTML editors changes how the post is stored.
    if ((next === "markdown") !== (mode === "markdown")) setDirty(true);
    setMarkdownPreview(false);
    setMode(next);
  }

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  async function save(intent: Intent) {
    if (!editor) return;
    const live = status === "published";
    const progress = { publish: "Publishing…", unpublish: "Unpublishing…", save: live ? "Updating…" : "Saving draft…" }[intent];
    const success = {
      publish: "Published. It is live on the site.",
      unpublish: "Moved back to drafts. It is no longer on the site.",
      save: live ? "Updated. The changes are live." : "Draft saved.",
    }[intent];

    status$.working(progress);
    setErrors({});
    const result = await savePost({
      id: post?.id,
      title,
      slug: effectiveSlug,
      excerpt,
      format: mode === "markdown" ? "markdown" : "rich",
      contentHtml: mode === "visual" ? editor.getHTML() : mode === "html" ? htmlSource : "",
      markdown: mode === "markdown" ? markdown : "",
      cover,
      category,
      tags: tagList,
      featured,
      seoTitle,
      metaDescription,
      focusKeyword,
      intent,
    });

    if (!result.ok) {
      setErrors(result.errors);
      // Open the section that holds the first problem.
      const first = SECTIONS.find((s) => s.fields.some((field) => field in result.errors));
      if (first) setSection(first.id);
      status$.fail(result.errors.form ?? "Not saved. Some fields need attention; they are marked in red.");
      return;
    }
    setDirty(false);
    // A warning (e.g. outside images removed) stays on screen until dismissed.
    if (result.warning) status$.fail(`${success} ${result.warning}`);
    else status$.done(success);
    if (!post) {
      // First save of a new post: continue on its edit page.
      window.setTimeout(() => router.replace(`/admin/blog/${result.id}/edit/`), 900);
      return;
    }
    setStatus(result.status);
    setSlug(result.slug);
    setSlugTouched(true);
    setSavedCoverId(cover?.publicId ?? null);
    if (result.status === "published") setSlugLocked(true);
  }

  async function remove() {
    if (!post) return;
    const confirmed = await status$.confirm({
      title: "Delete this post?",
      body: "It is removed from the site straight away, along with its images. To take it off the site but keep it, use Unpublish instead.",
      confirmLabel: "Delete post",
    });
    if (!confirmed) return;
    status$.working("Deleting…");
    const result = await deletePost(post.id);
    if (!result.ok) {
      status$.fail(result.error);
      return;
    }
    setDirty(false);
    status$.done("Post deleted.");
    window.setTimeout(() => {
      router.replace("/admin/blog/");
      router.refresh();
    }, 900);
  }

  const sectionHasError = (id: SectionId) =>
    SECTIONS.find((s) => s.id === id)!.fields.some((field) => field in errors);

  return (
    <div className="admin-fade mx-auto w-full max-w-[1320px] px-5 pb-16 sm:px-8">
      {/* Action bar: sticks under the 64px profile header so save/publish are always in view. */}
      <div className="sticky top-16 z-20 -mx-5 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-chalk-2/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog/" className="text-[14px] font-semibold text-ink-soft hover:text-mat-deep">
            ← All posts
          </Link>
          <StatusPill status={status} />
          {dirty ? <span className="text-[13px] text-ink-soft">Unsaved changes</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {post ? (
            <button type="button" onClick={remove} className="btn min-h-10 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50">
              Delete
            </button>
          ) : null}
          {post && status === "published" ? (
            <a href={`/blog/${slug}/`} target="_blank" rel="noreferrer" className="btn btn-ghost-light min-h-10">
              View post ↗
            </a>
          ) : null}
          {status === "published" ? (
            <>
              <button type="button" onClick={() => save("unpublish")} className="btn btn-ghost-light min-h-10">
                Unpublish
              </button>
              {dirty ? (
                <button type="button" onClick={() => save("save")} className="btn btn-primary min-h-10">
                  Update
                </button>
              ) : null}
            </>
          ) : (
            <>
              {dirty ? (
                <button type="button" onClick={() => save("save")} className="btn btn-ghost-light min-h-10">
                  Save draft
                </button>
              ) : null}
              <button type="button" onClick={() => save("publish")} className="btn btn-primary min-h-10">
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Section menu: one section at a time, a dot marks sections with errors. */}
        <nav aria-label="Post sections" className="flex gap-2 overflow-x-auto lg:sticky lg:top-40 lg:flex-col">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={section === id ? "page" : undefined}
              onClick={() => setSection(id)}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-[14px] font-semibold transition-colors ${
                section === id ? "bg-chalk text-ink shadow-sm" : "text-ink-soft hover:bg-chalk/60 hover:text-ink"
              }`}
            >
              {label}
              {sectionHasError(id) ? <span className="size-2 rounded-full bg-red-600" aria-label="has errors" /> : null}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {/* Content (kept mounted while hidden so the editor keeps its undo history). Each section
              fades in when shown: the animation replays whenever `hidden` is removed. */}
          <div hidden={section !== "content"} className="admin-fade space-y-6">
            <section className={`${CARD} space-y-5 p-6 sm:p-8`}>
              <Field
                name="title"
                label="Title"
                value={title}
                maxLength={POST_LIMITS.title}
                placeholder="e.g. Five footwork drills for beginners"
                error={errors.title}
                onChange={(event) => edit(setTitle)(event.target.value)}
                className="h-14 text-[22px] font-bold"
              />
              <Field
                name="slug"
                label="URL"
                value={effectiveSlug}
                disabled={slugLocked}
                maxLength={POST_LIMITS.slug}
                hint={
                  slugLocked
                    ? `/blog/${effectiveSlug}/ is locked because the post has been published (links may already be shared).`
                    : `/blog/${effectiveSlug || "…"}/`
                }
                error={errors.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  edit(setSlug)(slugify(event.target.value));
                }}
                className="disabled:cursor-not-allowed disabled:bg-chalk-2 disabled:text-ink-soft"
              />
              <Field
                as="textarea"
                name="excerpt"
                label="Summary"
                rows={3}
                value={excerpt}
                maxLength={POST_LIMITS.excerpt}
                placeholder="One or two sentences. Shown on blog cards and in Google results."
                hint={`${excerpt.length}/${POST_LIMITS.excerpt}`}
                error={errors.excerpt}
                onChange={(event) => edit(setExcerpt)(event.target.value)}
                className="h-28 min-h-0 resize-none"
              />
            </section>

            <section className={`${CARD} p-6 sm:p-8`}>
              <h2 className="mb-5 text-[15px] font-extrabold">Cover image</h2>
              <CoverPicker
                cover={cover}
                savedPublicId={savedCoverId}
                error={errors.cover}
                onChange={edit(setCover)}
                pickImage={pickImage}
              />
            </section>

            <section className={`${CARD} overflow-clip`}>
              {/* Mode switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
                <div role="tablist" aria-label="Editing mode" className="inline-flex rounded-xl bg-chalk-2 p-1">
                  {MODES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={mode === id}
                      onClick={() => switchMode(id)}
                      className={`rounded-lg px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${
                        mode === id ? "bg-chalk text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {mode === "markdown" ? (
                  <div className="inline-flex rounded-xl bg-chalk-2 p-1" role="tablist" aria-label="Markdown view">
                    {(["Write", "Preview"] as const).map((label) => {
                      const selected = markdownPreview === (label === "Preview");
                      return (
                        <button
                          key={label}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setMarkdownPreview(label === "Preview")}
                          className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${selected ? "bg-chalk text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ) : mode === "html" ? (
                  <p className="text-[12.5px] text-ink-soft">Tables and other HTML the Visual tab lacks are kept only if you save from here.</p>
                ) : null}
              </div>

              {/* Visual (kept mounted so the editor keeps its history) */}
              <div hidden={mode !== "visual"}>
                {editor ? <EditorToolbar editor={editor} onPickImage={() => void insertImages([undefined])} ask={ask} /> : null}
                <EditorContent editor={editor} className="px-6 py-6 sm:px-10 sm:py-8" />
              </div>

              {mode === "html" ? (
                <SourceEditor
                  language="html"
                  value={htmlSource}
                  onChange={edit(setHtmlSource)}
                  onInsertImage={() => pickBodyImage()}
                />
              ) : null}

              {mode === "markdown" && !markdownPreview ? (
                <SourceEditor
                  language="markdown"
                  value={markdown}
                  onChange={edit(setMarkdown)}
                  onInsertImage={() => pickBodyImage()}
                />
              ) : null}

              {mode === "markdown" && markdownPreview ? (
                // Preview of the admin's own Markdown in their own browser; the stored copy is sanitised on save.
                <div
                  className="blog-prose min-h-[520px] px-6 py-6 sm:px-10 sm:py-8"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) || "<p><em>Nothing to preview yet.</em></p>" }}
                />
              ) : null}

              {errors.content ? <p className="px-6 pb-6 text-[13px] text-red-700 sm:px-10">{errors.content}</p> : null}
            </section>
          </div>

          {section === "details" ? (
            <section className={`admin-fade ${CARD} space-y-5 p-6 sm:p-8`}>
              <h2 className="text-[18px] font-extrabold">Other details</h2>
              <Field
                name="category"
                label="Category"
                optional
                list="category-options"
                value={category}
                maxLength={POST_LIMITS.category}
                placeholder="e.g. Training"
                error={errors.category}
                onChange={(event) => edit(setCategory)(event.target.value)}
              />
              <datalist id="category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <Field
                name="tags"
                label="Tags"
                optional
                value={tags}
                placeholder="footwork, beginners"
                hint={`Separate with commas. Up to ${POST_LIMITS.tagCount}.`}
                error={errors.tags}
                onChange={(event) => edit(setTags)(event.target.value)}
              />
              <label className="flex items-start gap-3 rounded-2xl bg-chalk-2 p-4">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => edit(setFeatured)(event.target.checked)}
                  className="mt-0.5 size-4 accent-mat"
                />
                <span>
                  <span className="block text-[14px] font-semibold">Feature this post</span>
                  <span className="block text-[12.5px] text-ink-soft">Featured posts are shown first on the homepage and under other articles.</span>
                </span>
              </label>
              {post ? (
                <div className="border-t border-ink/10 pt-5">
                  <h3 className="eyebrow text-ink-soft">History</h3>
                  <ul className="mt-2 space-y-1 text-[14px] text-ink-soft">
                    {post.history.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <Link href="/admin/activity/" className="mt-3 inline-block text-[13.5px] font-semibold text-mat-deep hover:underline">
                    See all activity
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}

          {section === "seo" ? (
            <section className={`admin-fade ${CARD} p-6 sm:p-8`}>
              <h2 className="mb-5 text-[18px] font-extrabold">SEO</h2>
              <SeoPanel
                title={title}
                slug={effectiveSlug}
                excerpt={excerpt}
                bodyHtml={currentHtml()}
                cover={cover}
                tags={tagList}
                seoTitle={seoTitle}
                metaDescription={metaDescription}
                focusKeyword={focusKeyword}
                errors={errors}
                onSeoTitle={edit(setSeoTitle)}
                onMetaDescription={edit(setMetaDescription)}
                onFocusKeyword={edit(setFocusKeyword)}
              />
            </section>
          ) : null}
        </div>
      </div>

      {promptDialog}
      {imageDialog}
      {status$.dialog}
    </div>
  );
}
