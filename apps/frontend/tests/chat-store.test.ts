import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@store/chat-store";

describe("chat-store", () => {
  beforeEach(() => {
    // Сбрасываем данные, не перезаписывая actions zustand
    useChatStore.setState({
      chats: [],
      messages: {},
      pending: {},
      pinned: [],
      drafts: {},
      unread: {},
      chatMeta: {}
    } as any);
  });

  it("appends message", () => {
    useChatStore.getState().appendMessage(1, {
      id: 1,
      chat_id: 1,
      sender_id: 1,
      body: "hi",
      inserted_at: new Date().toISOString(),
      encrypted: false,
      envelope_metadata: {}
    });
    expect(useChatStore.getState().messages[1].length).toBe(1);
  });
});

