"use client";

import { useThemeStore } from "@store/theme-store";
import { Button } from "@components/ui/button";
import { SegmentedControl } from "@components/ui/segmented";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
import { useState } from "react";
import { Moon, Paintbrush, Sun, Palette, MonitorSmartphone } from "lucide-react";

export default function ThemeEditor() {
  const {
    theme,
    primaryColor,
    fontSize,
    density,
    setTheme,
    setPrimaryColor,
    setFontSize,
    setDensity,
    syncWithBackend
  } = useThemeStore();
  const [syncing, setSyncing] = useState(false);

  const saveToBackend = async () => {
    setSyncing(true);
    try {
      await syncWithBackend();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm text-[var(--pc-text-muted)]">Вид и удобство</p>
            <h2 className="text-xl font-semibold">Настройка темы</h2>
          </div>
          <Badge tone="info" variant="soft">
            Синхронизация с сервером
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Тема</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant={theme === "light" ? "primary" : "secondary"}
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4" />
                Светлая
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "secondary"}
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4" />
                Тёмная
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Цвет акцента</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-24 h-10"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Размер шрифта</span>
            </div>
            <SegmentedControl
              options={[
                { label: "S", value: "sm" },
                { label: "M", value: "md" },
                { label: "L", value: "lg" }
              ]}
              value={fontSize}
              onChange={(val) => setFontSize(val as "sm" | "md" | "lg")}
            />
          </div>

          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Плотность</span>
            </div>
            <SegmentedControl
              options={[
                { label: "Компактно", value: "compact" },
                { label: "Комфортно", value: "comfortable" }
              ]}
              value={density}
              onChange={(val) => setDensity(val as "compact" | "comfortable")}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={saveToBackend} disabled={syncing}>
            {syncing ? "Сохраняю..." : "Сохранить на сервере"}
          </Button>
        </div>
      </div>
    </div>
  );
}
