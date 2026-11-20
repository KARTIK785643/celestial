import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** The shared field look. */
const FIELD_BASE =
  "w-full min-w-0 rounded-xl border border-ink/15 bg-chalk px-4 text-[15px] text-ink transition-[border-color,box-shadow] placeholder:text-ink-soft/60 hover:border-mat/60 focus-visible:border-mat focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mat/20 aria-invalid:border-red-600 aria-invalid:ring-4 aria-invalid:ring-red-600/10";

type Common = {
  /** Also the control's id, so the label and control cannot drift apart. */
  name: string;
  label: string;
  /** Server-side message for this field. */
  error?: string;
  /** Small helper line under the control. */
  hint?: string;
  optional?: boolean;
  className?: string;
};

type InputProps = Common & { as?: "input" } & Omit<ComponentProps<"input">, "id" | "name" | "className">;
type TextareaProps = Common & { as: "textarea" } & Omit<ComponentProps<"textarea">, "id" | "name" | "className">;

/** A labelled input or textarea with its hint and error wired up for screen readers. */
export function Field(props: InputProps | TextareaProps) {
  const { name, label, error, hint, optional, className } = props;
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ") || undefined;
  const shared = { id: name, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={name} className="text-[13.5px] font-semibold text-ink">
          {label}
        </label>
        {optional ? <span className="eyebrow text-[10px] text-ink-soft">Optional</span> : null}
      </div>

      {props.as === "textarea" ? (
        <textarea
          {...stripCommon(props)}
          {...shared}
          className={cn(FIELD_BASE, "min-h-24 py-3 leading-relaxed", className)}
        />
      ) : (
        <input {...stripCommon(props)} {...shared} className={cn(FIELD_BASE, "h-12", className)} />
      )}

      {hint ? (
        <p id={`${name}-hint`} className="text-[12.5px] text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="text-[13px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Removes Field's own props so only native attributes reach the DOM element. */
function stripCommon<T extends Common & { as?: string }>(props: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { as, name, label, error, hint, optional, className, ...rest } = props;
  return rest;
}
