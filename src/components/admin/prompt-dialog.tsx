"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Field } from "@/components/forms/field";

export type PromptOptions = {
  title: string;
  label: string;
  hint?: string;
  placeholder?: string;
  initial?: string;
  confirmLabel: string;
  cancelLabel?: string;
};

type Request = PromptOptions & { resolve: (value: string | null) => void };

/**
 * An in-page replacement for window.prompt(). `ask()` opens a modal with one input and resolves
 * with the text (Confirm) or null (Cancel / Esc). Render `dialog` once in the component tree.
 */
export function usePrompt(): { ask: (options: PromptOptions) => Promise<string | null>; dialog: ReactNode } {
  const [request, setRequest] = useState<Request | null>(null);

  const ask = useCallback(
    (options: PromptOptions) => new Promise<string | null>((resolve) => setRequest({ ...options, resolve })),
    []
  );

  const dialog = request ? (
    <PromptDialog
      {...request}
      onDone={(value) => {
        request.resolve(value);
        setRequest(null);
      }}
    />
  ) : null;

  return { ask, dialog };
}

function PromptDialog({
  title,
  label,
  hint,
  placeholder,
  initial = "",
  confirmLabel,
  cancelLabel = "Cancel",
  onDone,
}: PromptOptions & { onDone: (value: string | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onDone(null);
      }}
      className="m-auto w-[min(92vw,440px)] rounded-3xl border border-ink/10 bg-chalk p-7 text-ink shadow-xl backdrop:bg-court-950/50"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onDone(value.trim());
        }}
      >
        <h2 className="mb-5 text-[20px] font-extrabold tracking-[-0.01em]">{title}</h2>
        <Field
          name="prompt-value"
          label={label}
          hint={hint}
          placeholder={placeholder}
          value={value}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
        />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => onDone(null)} className="btn btn-ghost-light">
            {cancelLabel}
          </button>
          <button type="submit" className="btn btn-primary">
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
