"use client";

import { create } from "zustand";
import axios from "axios";
import api from "@lib/api";
import type { Chat } from "@t/chat";
import type { Message } from "@t/message";
import { persist, restore } from "@lib/storage";
import { encryptText, decryptText } from "@lib/crypto";
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
  sendMessage: (chatId: number, body: string, envelope?: Record<string, unknown>) => Promise<void>;
  editMessage: (chatId: number, messageId: number, body: string, envelope?: Record<string, unknown>) => Promise<void>;
  forwardMessage: (messageId: number, targetChatId: number) => Promise<Message | null>;
  reactToMessage: (messageId: number, emoji: string, remove?: boolean) => Promise<void>;
  saveDraft: (chatId: number, value: string) => void;
  togglePin: (chatId: number) => void;
  markRead: (chatId: number) => void;
  appendMessage: (chatId: number, message: Message) => Promise<void>;
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

async function normalizeMessagePayload(message: Message): Promise<Message> {
  const envelope = (message.envelope_metadata || {}) as any;

  if (!message.encrypted) {
    return { ...message, envelope_metadata: envelope };
  }

  try {
    const body = await decryptText(message.body, envelope.iv);
    return { ...message, body: body || "", envelope_metadata: envelope };
  } catch {
    return { ...message, envelope_metadata: envelope, body: "[encrypted]" };
  }
}

function persistState(next: ChatState) {
  persist(STORAGE_KEY, next);
}

function findChatIdByMessage(state: ChatState, messageId: number): number | null {
  const entries = Object.entries(state.messages);
  for (const [cid, list] of entries) {
    if ((list || []).some((m) => m.id === messageId)) {
      return Number(cid);
    }
  }
  return null;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  ...initialState,
  async loadChats() {
    if (!useAuthStore.getState().token) return;

    try {
      const res = await api.get("/chats");
      const chats = res.data.chats as Chat[];
      set((s) => {
        const meta: Record<number, { kind?: "direct" | "group"; member_ids?: number[] }> = {};
        chats.forEach((c) => {
          meta[c.id] = { kind: c.kind, member_ids: c.member_ids || c.members?.map((m) => m.id) };
        });
        const next = { ...s, chats, chatMeta: { ...s.chatMeta, ...meta } };
        persistState(next);
        return next;
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      throw error;
    }
  },
  async loadMessages(chatId: number) {
    if (!useAuthStore.getState().token) return;

    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      const incoming = res.data.messages as Message[];
      const normalized = await Promise.all(
        incoming.map(async (m) => ({
          ...((await normalizeMessagePayload(m)) as Message),
          status: "sent" as const
        }))
      );

      const byId = new Map<string | number, Message>();
      normalized.forEach((m) => {
        const key = m.id ?? m.localId;
        if (key != null) byId.set(key, m);
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
        persistState(next);
        return next;
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      throw error;
    }
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
      persistState(next);
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
      persistState(next);
      return next;
    });
    return chat;
  },
  async sendMessage(chatId: number, body: string, envelope: Record<string, unknown> = {}) {
    const encryption = await encryptText(body);
    const envelopeMeta = {
      ...(envelope || {}),
      iv: encryption.iv,
      key_fingerprint: encryption.keyFingerprint
    } as Record<string, unknown>;

    const optimistic: Message = {
      id: undefined,
      localId: `local-${Date.now()}`,
      chat_id: chatId,
      sender_id: useAuthStore.getState().user?.id ?? 0,
      body,
      inserted_at: new Date().toISOString(),
      encrypted: true,
      envelope_metadata: envelopeMeta,
      status: "sending"
    };

    set((s) => {
      const existing = s.messages[chatId] || [];
      const existingMap = new Map(existing.map((m) => [m.id ?? m.localId ?? crypto.randomUUID(), m]));
      const key = optimistic.id ?? optimistic.localId ?? crypto.randomUUID();
      existingMap.set(key, optimistic);
      const next = {
        ...s,
        messages: { ...s.messages, [chatId]: Array.from(existingMap.values()) }
      };
      persistState(next);
      return next;
    });

    try {
      const res = await api.post(`/chats/${chatId}/messages`, {
        body: encryption.ciphertext,
        encrypted: true,
        envelope_metadata: envelopeMeta
      });
      const msg = await normalizeMessagePayload(res.data.message as Message);
      set((s) => {
        const existing = s.messages[chatId] || [];
        const map = new Map<string | number, Message>();
        existing.forEach((m) => {
          const key = m.id ?? m.localId;
          if (key == null) return;
          if (m.localId && m.localId === optimistic.localId) return;
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
        persistState(next);
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
        persistState(next);
        return next;
      });
      throw e;
    }
  },
  async editMessage(chatId: number, messageId: number, body: string, envelope: Record<string, unknown> = {}) {
    const encryption = await encryptText(body);
    const envelopeMeta = {
      ...(envelope || {}),
      iv: encryption.iv,
      key_fingerprint: encryption.keyFingerprint
    } as Record<string, unknown>;

    const res = await api.put(`/chats/${chatId}/messages/${messageId}`, {
      body: encryption.ciphertext,
      envelope_metadata: envelopeMeta
    });
    const msg = await normalizeMessagePayload(res.data.message as Message);

    set((s) => {
      const existing = s.messages[chatId] || [];
      const map = new Map(existing.map((m) => [m.id ?? m.localId ?? crypto.randomUUID(), m]));
      const key = msg.id ?? msg.localId ?? messageId;
      map.set(key, msg);
      const next = { ...s, messages: { ...s.messages, [chatId]: Array.from(map.values()) } };
      persistState(next);
      return next;
    });
  },
  async forwardMessage(messageId: number, targetChatId: number) {
    const state = get();
    const chatId = findChatIdByMessage(state, messageId) || targetChatId;
    try {
      const res = await api.post(`/chats/${chatId}/messages/${messageId}/forward`, {
        target_chat_id: targetChatId
      });
      const msg = await normalizeMessagePayload(res.data.message as Message);
      await get().appendMessage(targetChatId, msg);
      return msg;
    } catch (e) {
      return null;
    }
  },
  async reactToMessage(messageId: number, emoji: string, remove = false) {
    const state = get();
    const chatId = findChatIdByMessage(state, messageId);
    if (!chatId) return;

    const path = `/chats/${chatId}/messages/${messageId}/reactions${remove ? `/${emoji}` : ""}`;
    const res = remove
      ? await api.delete(path)
      : await api.post(path, { emoji });

    const msg = await normalizeMessagePayload(res.data.message as Message);
    set((s) => {
      const existing = s.messages[chatId] || [];
      const map = new Map(existing.map((m) => [m.id ?? m.localId ?? crypto.randomUUID(), m]));
      map.set(msg.id ?? messageId, msg);
      const next = { ...s, messages: { ...s.messages, [chatId]: Array.from(map.values()) } };
      persistState(next);
      return next;
    });
  },
  saveDraft(chatId, value) {
    set((s) => {
      const next = { ...s, drafts: { ...s.drafts, [chatId]: value } };
      persistState(next);
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
      persistState(next);
      return next;
    });
  },
  markRead(chatId) {
    set((s) => {
      const next = { ...s, unread: { ...s.unread, [chatId]: 0 } };
      persistState(next);
      return next;
    });
  },
  async appendMessage(chatId: number, message: Message) {
    const normalized = await normalizeMessagePayload(message);
    const currentUserId = useAuthStore.getState().user?.id;
    const isForeign = normalized.sender_id !== currentUserId;

    set((s) => {
      const existing = s.messages[chatId] || [];
      const key = normalized.id ?? normalized.localId ?? crypto.randomUUID();
      const map = new Map(existing.map((m) => [m.id ?? m.localId ?? crypto.randomUUID(), m]));
      map.set(key, { ...normalized, status: normalized.status ?? "sent" });
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
      persistState(next);
      return next;
    });
    if (isForeign) {
      useNotificationStore.getState().push({
        title: "Новое сообщение в чате",
        body: normalized.body,
        chatId,
        type: "message"
      });
    }
  }
}));
