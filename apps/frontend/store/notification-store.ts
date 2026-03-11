"use client";

import { create } from "zustand";
import { persist, restore } from "@lib/storage";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  chatId?: number;
  type?: "message" | "system";
  read?: boolean;
  createdAt: string;
};

type State = {
  items: NotificationItem[];
};

type Actions = {
  push: (item: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const STORAGE_KEY = "privchat_notifications";

const defaultState: State = { items: [] };
const restored = restore<State>(STORAGE_KEY, defaultState);

export const useNotificationStore = create<State & Actions>((set) => ({
  ...defaultState,
  ...restored,
  push(item) {
    const notif: NotificationItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false
    };
    set((s) => {
      const next = { ...s, items: [notif, ...s.items].slice(0, 30) };
      persist(STORAGE_KEY, next);
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(item.title, { body: item.body, silent: false });
      }
      return next;
    });
  },
  markRead(id) {
    set((s) => {
      const items = s.items.map((n) => (n.id === id ? { ...n, read: true } : n));
      const next = { ...s, items };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  markAllRead() {
    set((s) => {
      const items = s.items.map((n) => ({ ...n, read: true }));
      const next = { ...s, items };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  clear() {
    set(() => {
      const next = { items: [] };
      persist(STORAGE_KEY, next);
      return next;
    });
  }
}));
