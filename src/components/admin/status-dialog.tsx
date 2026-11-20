"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

type Confirm = { title: string; body: string; confirmLabel: string };

type State =
  | ({ step: "confirm"; resolve: (ok: boolean) => void } & Confirm)
  | { step: "working"; message: string }
  | { step: "done"; message: string }
  | { step: "error"; message: string };

export type StatusApi = {
  /** Asks first (e.g. before deleting); resolves true on confirm. */
  confirm: (options: Confirm) => Promise<boolean>;
  /** Shows a spinner and a message; cannot be dismissed until done/fail. */
  working: (message: string) => void;
  /** Success: closes itself after a moment. */
  done: (message: string) => void;
  /** Failure: stays open until dismissed. */
  fail: (message: string) => void;
};

/**
 * One popup for every long-running admin action (save, publish, unpublish, delete): buttons
 * never change their labels; progress and the result are shown here instead.
 * Render `dialog` once in the component tree.
 */
export function useStatusDialog(): StatusApi & { dialog: ReactNode } {
  const [state, setState] = useState<State | null>(null);

  const confirm = useCallback(
    (options: Confirm) => new Promise<boolean>((resolve) => setState({ step: "confirm", resolve, ...options })),
    []
  );
  const working = useCallback((message: string) => setState({ step: "working", message }), []);
  const done = useCallback((message: string) => setState({ step: "done", message }), []);
  const fail = useCallback((message: string) => setState({ step: "error", message }), []);

  // A success message closes itself.
  useEffect(() => {
    if (state?.step !== "done") return;
    const timer = window.setTimeout(() => setState(null), 1800);
    return () => window.clearTimeout(timer);
  }, [state]);

  const close = () => {
    if (state?.step === "confirm") state.resolve(false);
    if (state?.step !== "working") setState(null);
  };

  const dialog = state ? (
    <StatusDialog
      state={state}
      onClose={close}
      onConfirm={() => {
        if (state.step === "confirm") state.resolve(true);
      }}
    />
  ) : null;

  return { confirm, working, done, fail, dialog };
}

function StatusDialog({ state, onClose, onConfirm }: { state: State; onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-live="polite"
      onCancel={(event) => {
        event.preventDefault();
        onClose(); // ignored while working
      }}
      className="admin-fade m-auto w-[min(92vw,420px)] rounded-3xl border border-ink/10 bg-chalk p-7 text-ink shadow-xl backdrop:bg-court-950/50"
    >
      {state.step === "confirm" ? (
        <>
          <h2 className="text-[20px] font-extrabold tracking-[-0.01em]">{state.title}</h2>
          <p className="mt-2 text-[15px] text-ink-soft">{state.body}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost-light">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} className="btn bg-red-600 text-chalk hover:bg-red-700">
              {state.confirmLabel}
            </button>
          </div>
        </>
      ) : (
        <div key={state.step} className="admin-fade flex items-start gap-4">
          <span className="mt-0.5 shrink-0">
            {state.step === "working" ? (
              <span className="block size-7 animate-spin rounded-full border-[3px] border-mat/25 border-t-mat" aria-hidden="true" />
            ) : state.step === "done" ? (
              <CheckCircle size={28} weight="fill" className="text-mat" aria-hidden="true" />
            ) : (
              <WarningCircle size={28} weight="fill" className="text-red-600" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p role={state.step === "error" ? "alert" : "status"} className="pt-0.5 text-[16px] font-semibold">
              {state.message}
            </p>
            {state.step !== "working" ? (
              <div className="mt-5 flex justify-end">
                <button type="button" onClick={onClose} className="btn btn-ghost-light min-h-10" autoFocus>
                  {state.step === "error" ? "Close" : "OK"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </dialog>
  );
}
