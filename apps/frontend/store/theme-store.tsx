"use client";

import { create } from "zustand";
import { persist, restore } from "@lib/storage";
import api from "@lib/api";
import React, { useEffect } from "react";

type ThemeState = {
  theme: "light" | "dark";
  primaryColor: string;
  fontSize: "sm" | "md" | "lg";
  density: "compact" | "comfortable";
};

type ThemeActions = {
  setTheme: (theme: ThemeState["theme"]) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: ThemeState["fontSize"]) => void;
  setDensity: (density: ThemeState["density"]) => void;
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
};

const STORAGE_KEY = "privchat_theme";

const defaultTheme: ThemeState = {
  theme: "light",
  primaryColor: "#6366f1",
  fontSize: "md",
  density: "comfortable"
};

const initial = restore<ThemeState>(STORAGE_KEY, defaultTheme);

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  ...initial,
  setTheme(theme) {
    set((s) => {
      const next = { ...s, theme };
      persist(STORAGE_KEY, next);
      applyDomTheme(next);
      return next;
    });
  },
  setPrimaryColor(primaryColor) {
    set((s) => {
      const next = { ...s, primaryColor };
      persist(STORAGE_KEY, next);
      applyDomTheme(next);
      return next;
    });
  },
  setFontSize(fontSize) {
    set((s) => {
      const next = { ...s, fontSize };
      persist(STORAGE_KEY, next);
      applyDomTheme(next);
      return next;
    });
  },
  setDensity(density) {
    set((s) => {
      const next = { ...s, density };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  async syncWithBackend() {
    const s = get();
    await api.put("/settings", {
      theme: s.theme,
      primary_color: s.primaryColor,
      font_size: s.fontSize,
      density: s.density
    });
  },
  async loadFromBackend() {
    const res = await api.get("/settings");
    const settings = res.data.settings as any;
    set((s) => {
      const next = {
        ...s,
        theme: settings.theme,
        primaryColor: settings.primary_color,
        fontSize: settings.font_size,
        density: settings.density
      };
      persist(STORAGE_KEY, next);
      applyDomTheme(next);
      return next;
    });
  }
}));

function applyDomTheme(theme: ThemeState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme.theme;
  root.style.setProperty("--pc-primary", theme.primaryColor);
  root.style.setProperty(
    "--pc-font-size",
    theme.fontSize === "sm"
      ? "0.875rem"
      : theme.fontSize === "lg"
      ? "1.1rem"
      : "1rem"
  );
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const loadFromBackend = useThemeStore((s) => s.loadFromBackend);

  useEffect(() => {
    applyDomTheme(useThemeStore.getState());
    loadFromBackend().catch(() => {});
  }, [loadFromBackend]);

  return <>{children}</>;
};
