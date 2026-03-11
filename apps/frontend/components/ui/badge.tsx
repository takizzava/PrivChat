"use client";

import { ReactNode } from "react";
import { cn } from "@lib/utils";

interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  variant?: "solid" | "soft";
  className?: string;
}

const toneMap: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-white/10 text-[var(--pc-text)] border-[var(--pc-border)]",
  success: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  warning: "bg-amber-400/15 text-amber-200 border-amber-300/30",
  danger: "bg-rose-500/15 text-rose-100 border-rose-400/30",
  info: "bg-sky-500/15 text-sky-100 border-sky-400/30"
};

export function Badge({
  children,
  tone = "neutral",
  variant = "soft",
  className
}: BadgeProps) {
  const base =
    variant === "solid"
      ? "bg-[var(--pc-primary)] text-white border-transparent"
      : toneMap[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide border",
        base,
        className
      )}
    >
      {children}
    </span>
  );
}
