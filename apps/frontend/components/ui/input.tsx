"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: ReactNode;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, label, hint, ...props }, ref) => {
    const control = (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-2 text-sm text-[var(--pc-text)] transition focus-within:border-[var(--pc-primary)] focus-within:shadow-[0_0_0_1px_var(--pc-primary)]"
        )}
      >
        {prefix && <div className="text-[var(--pc-text-muted)]">{prefix}</div>}
        <input
          ref={ref}
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-[var(--pc-text-muted)]",
            className
          )}
          {...props}
        />
      </div>
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

Input.displayName = "Input";
