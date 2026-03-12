"use client";

import { create } from "zustand";
import api from "@lib/api";
import type { Chat } from "@t/chat";
import type { Message } from "@t/message";
import { persist, restore } from "@lib/storage";
import { useAuthStore } from "./auth-store";
import { useNotificationStore } from "./notification-store";

type ChatState = {
  chats: Chat[];
  messages: Record<number, Message[]>;
  pending: Record<number, Message[]>;
  pinned: number[];
  drafts: Record<number, string>;
  unread: Record<number, number>;
  chatMeta: Record<number, { kind?: "direct" | "group"; member_ids?: number[] }>;
};

type ChatActions = {
  loadChats: () => Promise<void>;
  loadMessages: (chatId: number) => Promise<void>;
  startDirectChat: (partnerId: number, name?: string) => Promise<Chat>;
  createGroupChat: (name: string, memberIds: number[]) => Promise<Chat>;
  sendMessage: (
    chatId: number,
    body: string,
    envelope?: Record<string, unknown>
  ) => Promise<void>;
  saveDraft: (chatId: number, value: string) => void;
  togglePin: (chatId: number) => void;
  markRead: (chatId: number) => void;
  appendMessage: (chatId: number, message: Message) => void;
};

const STORAGE_KEY = "privchat_chat_state";

const defaultState: ChatState = {
  chats: [],
  messages: {},
  pending: {},
  pinned: [],
  drafts: {},
  unread: {},
  chatMeta: {}
};

const restored = restore<ChatState>(STORAGE_KEY, defaultState);

const initialState: ChatState = {
  ...defaultState,
  ...restored,
  pinned: restored.pinned ?? [],
  drafts: restored.drafts ?? {},
  unread: restored.unread ?? {},
  messages: restored.messages ?? {},
  pending: restored.pending ?? {},
  chatMeta: restored.chatMeta ?? {}
};

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  ...initialState,
  async loadChats() {
    const res = await api.get("/chats");
    const chats = res.data.chats as Chat[];
    set((s) => {
      const meta: Record<number, { kind?: "direct" | "group"; member_ids?: number[] }> = {};
      chats.forEach((c) => {
        meta[c.id] = { kind: c.kind, member_ids: c.member_ids || c.members?.map((m) => m.id) };
      });
      const next = { ...s, chats, chatMeta: { ...s.chatMeta, ...meta } };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  async loadMessages(chatId: number) {
    const res = await api.get(`/chats/${chatId}/messages`);
    const incoming = res.data.messages as Message[];
    const byId = new Map<string | number, Message>();
    incoming.forEach((m) => {
      const key = m.id ?? m.localId;
      if (key != null) byId.set(key, { ...m, status: "sent" as const });
    });
    set((s) => {
      const next = {
        ...s,
        messages: {
          ...s.messages,
          [chatId]: Array.from(byId.values())
        },
        unread: { ...s.unread, [chatId]: 0 }
      };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  async startDirectChat(partnerId: number, name?: string) {
    const res = await api.post("/chats", { partner_id: partnerId, name });
    const chat = res.data.chat as Chat;
    set((s) => {
      const next = {
        ...s,
        chats: [chat, ...s.chats],
        unread: { ...s.unread, [chat.id]: 0 },
        chatMeta: {
          ...s.chatMeta,
          [chat.id]: { kind: (chat.kind || "direct") as "direct", member_ids: chat.member_ids }
        }
      };
      persist(STORAGE_KEY, next);
      return next;
    });
    return chat;
  },
  async createGroupChat(name: string, memberIds: number[]) {
    const res = await api.post("/chats", { name, kind: "group", member_ids: memberIds });
    const chat = res.data.chat as Chat;
    set((s) => {
      const next = {
        ...s,
        chats: [chat, ...s.chats],
        unread: { ...s.unread, [chat.id]: 0 },
        chatMeta: { ...s.chatMeta, [chat.id]: { kind: "group" as const, member_ids: memberIds } }
      };
      persist(STORAGE_KEY, next);
      return next;
    });
    return chat;
  },
  async sendMessage(chatId: number, body: string, envelope: Record<string, unknown> = {}) {
    const optimistic: Message = {
      id: undefined,
      localId: `local-${Date.now()}`,
      chat_id: chatId,
      sender_id: useAuthStore.getState().user?.id ?? 0,
      body,
      inserted_at: new Date().toISOString(),
      encrypted: false,
      envelope_metadata: envelope,
      status: "sending"
    };

    set((s) => {
      const existing = s.messages[chatId] || [];
      const existingMap = new Map(
        existing.map((m) => [m.id ?? m.localId ?? crypto.randomUUID(), m])
      );
      const key = optimistic.id ?? optimistic.localId ?? crypto.randomUUID();
      existingMap.set(key, optimistic);
      const next = {
        ...s,
        messages: { ...s.messages, [chatId]: Array.from(existingMap.values()) }
      };
      persist(STORAGE_KEY, next);
      return next;
    });

    try {
      const res = await api.post(`/chats/${chatId}/messages`, {
        body,
        encrypted: false,
        envelope_metadata: envelope
      });
      const msg = res.data.message as Message;
      set((s) => {
        const existing = s.messages[chatId] || [];
        // Дедуп: если сообщение уже пришло по сокету раньше ответа HTTP,
        // то удаляем/заменяем оптимистичное и не оставляем два одинаковых id.
        const map = new Map<string | number, Message>();
        existing.forEach((m) => {
          const key = m.id ?? m.localId;
          if (key == null) return;
          // пропускаем оптимистичное (заменим реальным)
          if (m.localId && m.localId === optimistic.localId) return;
          // пропускаем старую копию с тем же id (заменим реальным)
          if (msg.id != null && m.id === msg.id) return;
          map.set(key, m);
        });
        const realKey = (msg.id ?? optimistic.localId) as any;
        map.set(realKey, { ...msg, status: "sent" as const });
        const withReal = Array.from(map.values());
        const next = {
          ...s,
          messages: { ...s.messages, [chatId]: withReal }
        };
        persist(STORAGE_KEY, next);
        return next;
      });
    } catch (e) {
      set((s) => {
        const existing = s.messages[chatId] || [];
        const filtered = existing.map((m) =>
          m.localId === optimistic.localId ? { ...m, status: "failed" as const } : m
        );
        const next = {
          ...s,
          messages: { ...s.messages, [chatId]: filtered }
        };
        persist(STORAGE_KEY, next);
        return next;
      });
      throw e;
    }
  },
  saveDraft(chatId, value) {
    set((s) => {
      const next = { ...s, drafts: { ...s.drafts, [chatId]: value } };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  togglePin(chatId) {
    set((s) => {
      const isPinned = s.pinned.includes(chatId);
      const next = {
        ...s,
        pinned: isPinned ? s.pinned.filter((id) => id !== chatId) : [chatId, ...s.pinned]
      };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  markRead(chatId) {
    set((s) => {
      const next = { ...s, unread: { ...s.unread, [chatId]: 0 } };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  appendMessage(chatId: number, message: Message) {
    const currentUserId = useAuthStore.getState().user?.id;
    const isForeign = message.sender_id !== currentUserId;

    set((s) => {
      const existing = s.messages[chatId] || [];
      const key = message.id ?? message.localId ?? crypto.randomUUID();
      const map = new Map(
        existing.map((m) => [m.id ?? m.localId ?? crypto.randomUUID(), m])
      );
      map.set(key, { ...message, status: message.status ?? "sent" });
      const next = {
        ...s,
        messages: {
          ...s.messages,
          [chatId]: Array.from(map.values())
        },
        unread: isForeign
          ? {
              ...s.unread,
              [chatId]: (s.unread[chatId] ?? 0) + 1
            }
          : s.unread
      };
      persist(STORAGE_KEY, next);
      return next;
    });
    if (isForeign) {
      useNotificationStore
        .getState()
        .push({
          title: `Новое сообщение в чате`,
          body: message.body,
          chatId,
          type: "message"
        });
    }
  }
}));
