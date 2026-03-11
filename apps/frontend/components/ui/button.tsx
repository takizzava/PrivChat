"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl"
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--pc-primary)] text-white shadow-md shadow-indigo-900/30 hover:bg-[var(--pc-primary-strong)]",
  secondary:
    "bg-[var(--pc-surface-strong)] text-[var(--pc-text)] border border-[var(--pc-border)] hover:border-[var(--pc-border-strong)]",
  ghost:
    "text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] hover:bg-white/5",
  danger:
    "bg-[var(--pc-danger)] text-white shadow-md shadow-rose-900/30 hover:bg-[#e15561]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", block, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pc-primary)] focus-visible:ring-offset-[var(--pc-bg)] disabled:opacity-60 disabled:cursor-not-allowed",
        sizeStyles[size],
        variantStyles[variant],
        block && "w-full",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
