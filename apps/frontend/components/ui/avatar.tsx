"use client";

import { ReactNode } from "react";
import { cn } from "@lib/utils";

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  indicator?: "online" | "offline" | "none";
  className?: string;
}

const sizes: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base"
};

const gradients = [
  "from-indigo-500 to-sky-500",
  "from-emerald-500 to-teal-400",
  "from-orange-500 to-amber-400",
  "from-fuchsia-500 to-purple-500",
  "from-cyan-500 to-blue-500"
];

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Avatar({
  name,
  src,
  indicator = "none",
  size = "md",
  className
}: AvatarProps) {
  const initials = getInitials(name);
  const colorIndex =
    (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % gradients.length;
  const gradient = gradients[colorIndex];

  return (
    <div className={cn("relative shrink-0", sizes[size], className)}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br text-white font-semibold shadow-md shadow-black/20 overflow-hidden",
          gradient
        )}
      >
        {src ? (
          <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {indicator !== "none" && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--pc-surface)]",
            indicator === "online" ? "bg-emerald-400" : "bg-slate-500"
          )}
        />
      )}
    </div>
  );
}
