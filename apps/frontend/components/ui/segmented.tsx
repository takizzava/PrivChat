"use client";

import { cn } from "@lib/utils";

interface SegmentedProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: SegmentedProps<T>) {
  return (
    <div className="flex rounded-xl bg-[var(--pc-surface-strong)] p-1 border border-[var(--pc-border)]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--pc-primary)] text-white shadow-sm"
                : "text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
