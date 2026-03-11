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
            <p className="text-sm text-[var(--pc-text-muted)]">Тема и акцент</p>
            <h2 className="text-xl font-semibold">Оформление интерфейса</h2>
          </div>
          <Badge tone="info" variant="soft">
            Синхронизируется
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Режим</span>
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
              <span className="font-semibold">Акцентный цвет</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-24 h-12 p-1 cursor-pointer"
              />
              <div className="text-sm text-[var(--pc-text-muted)]">
                <p>Подберите брендовый цвет.</p>
                <p className="text-xs mt-1">Он применится к кнопкам, ссылкам и акцентам.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Размер шрифта</span>
            </div>
            <SegmentedControl
              options={[
                { label: "Компактный", value: "sm" },
                { label: "Стандарт", value: "md" },
                { label: "Крупный", value: "lg" }
              ]}
              value={fontSize}
              onChange={(v) => setFontSize(v as any)}
            />
          </div>

          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-[var(--pc-primary)]" />
              <span className="font-semibold">Плотность</span>
            </div>
            <SegmentedControl
              options={[
                { label: "Плотно", value: "compact" },
                { label: "Удобно", value: "comfortable" }
              ]}
              value={density}
              onChange={(v) => setDensity(v as any)}
            />
          </div>

          <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-[var(--pc-primary)]" />
                <span className="font-semibold">Синхронизация</span>
              </div>
              <p className="text-sm text-[var(--pc-text-muted)] mt-1">
                Сохраните текущие предпочтения в профиль, чтобы они применялись на всех
                устройствах.
              </p>
            </div>
            <Button onClick={saveToBackend} disabled={syncing}>
              {syncing ? "Сохраняем..." : "Сохранить в аккаунт"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
