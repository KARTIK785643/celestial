"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  ImageSquare,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Minus,
  Quotes,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextUnderline,
  type Icon,
} from "@phosphor-icons/react";
import type { PromptOptions } from "@/components/admin/prompt-dialog";

type Tool = { label: string; icon: Icon; active?: boolean; disabled?: boolean; run: () => void };

/** Formatting controls for the post body. Every format here is allowed by the sanitiser in lib/blog.ts. */
export function EditorToolbar({
  editor,
  onPickImage,
  ask,
}: {
  editor: Editor;
  onPickImage: () => void;
  ask: (options: PromptOptions) => Promise<string | null>;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullets: e.isActive("bulletList"),
      numbers: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const editLink = async () => {
    const current = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = await ask({
      title: current ? "Edit link" : "Add a link",
      label: "Link address",
      placeholder: "https://… or /first-session/",
      hint: "Leave empty to remove the link.",
      initial: current,
      confirmLabel: "Apply",
    });
    if (url === null) return;
    if (url === "") chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: url }).run();
  };

  const groups: Tool[][] = [
    [
      { label: "Bold", icon: TextB, active: state.bold, run: () => chain().toggleBold().run() },
      { label: "Italic", icon: TextItalic, active: state.italic, run: () => chain().toggleItalic().run() },
      { label: "Underline", icon: TextUnderline, active: state.underline, run: () => chain().toggleUnderline().run() },
    ],
    [
      { label: "Heading", icon: TextHTwo, active: state.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
      { label: "Subheading", icon: TextHThree, active: state.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: "Bulleted list", icon: ListBullets, active: state.bullets, run: () => chain().toggleBulletList().run() },
      { label: "Numbered list", icon: ListNumbers, active: state.numbers, run: () => chain().toggleOrderedList().run() },
      { label: "Quote", icon: Quotes, active: state.quote, run: () => chain().toggleBlockquote().run() },
      { label: "Divider", icon: Minus, run: () => chain().setHorizontalRule().run() },
    ],
    [
      { label: "Link", icon: LinkSimple, active: state.link, run: editLink },
      { label: "Image", icon: ImageSquare, run: onPickImage },
    ],
    [
      { label: "Undo", icon: ArrowUUpLeft, disabled: !state.canUndo, run: () => chain().undo().run() },
      { label: "Redo", icon: ArrowUUpRight, disabled: !state.canRedo, run: () => chain().redo().run() },
    ],
  ];

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      // Sticks under the profile header (64px) + the editor's action bar (64px) on desktop.
      className="z-10 flex flex-wrap items-center gap-1 border-b border-ink/10 bg-chalk/95 px-3 py-2 backdrop-blur lg:sticky lg:top-32"
    >
      {groups.map((group, index) => (
        <div key={index} className="flex items-center gap-0.5 border-ink/10 pr-1 [&:not(:last-child)]:border-r">
          {group.map(({ label, icon: IconComponent, active, disabled, run }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()} // keep the text selection
              onClick={run}
              className={`grid size-9 place-items-center rounded-lg transition-colors disabled:opacity-35 ${
                active ? "bg-mat/15 text-mat-deep" : "text-ink-soft hover:bg-ink/[0.06] hover:text-ink"
              }`}
            >
              <IconComponent size={18} weight={active ? "bold" : "regular"} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
