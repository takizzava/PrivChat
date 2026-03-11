"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  subtle?: boolean;
  size?: "sm" | "md";
}

export function IconButton({
  className,
  active,
  subtle,
  size = "md",
  ...props
}: IconButtonProps) {
  const sizing =
    size === "sm" ? "h-9 w-9 rounded-lg" : "h-10 w-10 rounded-xl";

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center text-[var(--pc-text-muted)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pc-primary)] focus-visible:ring-offset-[var(--pc-bg)]",
        sizing,
        subtle
          ? "hover:bg-white/5"
          : "bg-[var(--pc-surface-strong)] border border-[var(--pc-border)] hover:border-[var(--pc-border-strong)]",
        active && "text-[var(--pc-primary)] border-[var(--pc-primary)]",
        className
      )}
      {...props}
    />
  );
}
