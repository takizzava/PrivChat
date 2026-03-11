"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, ...props }, ref) => {
    const control = (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[120px] resize-none rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-2 text-sm text-[var(--pc-text)] placeholder:text-[var(--pc-text-muted)] focus:outline-none focus:border-[var(--pc-primary)] focus:shadow-[0_0_0_1px_var(--pc-primary)]",
          className
        )}
        {...props}
      />
    );

    if (!label) return control;

    return (
      <label className="flex flex-col gap-2 text-sm text-[var(--pc-text-muted)]">
        <span className="font-medium text-[var(--pc-text)]">{label}</span>
        {control}
        {hint && <span className="text-xs text-[var(--pc-text-muted)]">{hint}</span>}
      </label>
    );
  }
);

Textarea.displayName = "Textarea";
