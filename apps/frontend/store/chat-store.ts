"use client";

import { create } from "zustand";
import api from "@lib/api";
import { Chat } from "@types/chat";
import { Message } from "@types/message";
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
  createChat: (name: string) => Promise<Chat>;
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
        meta[c.id] = { kind: c.kind, member_ids: c.member_ids };
      });
      const next = { ...s, chats, chatMeta: { ...s.chatMeta, ...meta } };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  async createChat(name: string) {
    const res = await api.post("/chats", { name });
    const chat = res.data.chat as Chat;
    set((s) => {
      const next = {
        ...s,
        chats: [chat, ...s.chats],
        unread: { ...s.unread, [chat.id]: 0 },
        chatMeta: { ...s.chatMeta, [chat.id]: { kind: "direct" } }
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
        chatMeta: { ...s.chatMeta, [chat.id]: { kind: "group", member_ids: memberIds } }
      };
      persist(STORAGE_KEY, next);
      return next;
    });
    return chat;
  },
  async loadMessages(chatId: number) {
    const res = await api.get(`/chats/${chatId}/messages`);
    const incoming = res.data.messages as Message[];
    const byId = new Map<string | number, Message>();
    incoming.forEach((m) => {
      const key = m.id ?? m.localId;
      if (key != null) byId.set(key, { ...m, status: "sent" });
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
        const withReal = existing.map((m) => {
          if (m.localId === optimistic.localId || (msg.id && m.id === msg.id)) {
            return { ...msg, status: "sent" };
          }
          return m;
        });
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
          m.localId === optimistic.localId ? { ...m, status: "failed" } : m
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
        pinned: isPinned
          ? s.pinned.filter((id) => id !== chatId)
          : [chatId, ...s.pinned]
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
        unread: {
          ...s.unread,
          [chatId]: (s.unread[chatId] ?? 0) + 1
        }
      };
      persist(STORAGE_KEY, next);
      return next;
    });
    const currentUserId = useAuthStore.getState().user?.id;
    if (message.sender_id !== currentUserId) {
      useNotificationStore
        .getState()
        .push({
          title: `Новое сообщение в чате #${chatId}`,
          body: message.body,
          chatId,
          type: "message"
        });
    }
  }
})); 
