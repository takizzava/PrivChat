"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from "react";
import {
  ArrowLeft,
  Send,
  Wifi,
  WifiOff,
  Pin,
  Paperclip,
  X,
  Mic,
  Square
} from "lucide-react";

import AppShell from "@components/layout/app-shell";
import MessageBubble from "@components/chat/message-bubble";
import { ChatSidebar } from "@components/chat/chat-sidebar";
import { Button } from "@components/ui/button";
import { IconButton } from "@components/ui/icon-button";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
import { Skeleton } from "@components/ui/skeleton";

import { useAuthStore } from "@store/auth-store";
import { useChatStore } from "@store/chat-store";
import { useFriendsStore } from "@store/friends-store";

import { useSocketForChat } from "@lib/socket";
import { uploadFile } from "@lib/api";

import type { Message } from "@t/message";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);

  const {
    messages,
    loadMessages,
    sendMessage,
    saveDraft,
    drafts,
    pinned,
    togglePin,
    unread,
    chats,
    loadChats,
    markRead,
    startDirectChat,
    createGroupChat
  } = useChatStore();

  const contacts = useFriendsStore((s) => s.contacts);
  const loadContacts = useFriendsStore((s) => s.loadContacts);

  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatFilter, setChatFilter] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "pinned">("all");
  const [connected, setConnected] = useState(true);
  const [viewMode, setViewMode] = useState<"chats" | "friends">("chats");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<number[]>([]);
  const [groupBusy, setGroupBusy] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<
    Array<{
      name: string;
      type?: string;
      size: number;
      url?: string;
      uploading?: boolean;
      kind?: string;
    }>
  >([]);

  const [someoneTyping, setSomeoneTyping] = useState(false);
  const [recording, setRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const shouldStickToBottomRef = useRef(true);
  const lastRenderedChatIdRef = useRef<number | null>(null);
  const lastRenderedCountRef = useRef(0);

  const chatId = Number(params.id);
  const socketChannel = useSocketForChat(chatId, token);
  const list = messages[chatId] || [];
  const chat = chats.find((c) => c.id === chatId);
  const isPinned = pinned.includes(chatId);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !authHydrated) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!Number.isFinite(chatId)) {
      router.replace("/chats");
      return;
    }

    shouldStickToBottomRef.current = true;

    loadChats().catch(() => {});
    loadContacts().catch(() => {});
    loadMessages(chatId)
      .then(() => markRead(chatId))
      .catch(() => {});

    setInput(useChatStore.getState().drafts[chatId] ?? "");
  }, [
    hydrated,
    authHydrated,
    token,
    router,
    chatId,
    loadChats,
    loadContacts,
    loadMessages,
    markRead
  ]);

  useEffect(() => {
    if (!hydrated || !authHydrated || !token) return;
    if (!Number.isFinite(chatId)) return;

    markRead(chatId);
  }, [chatId, hydrated, authHydrated, token, markRead, list.length]);

  useEffect(() => {
    if (!socketChannel) return;

    setConnected(true);

    const handler = (payload: Message) => {
      useChatStore.getState().appendMessage(chatId, payload);
    };

    const typingHandler = (payload: any) => {
      if (!payload) return;
      if (payload.chat_id !== chatId) return;
      if (payload.user_id === currentUser?.id) return;

      setSomeoneTyping(Boolean(payload.typing));
    };

    socketChannel.on("message:new", handler);
    socketChannel.on("typing", typingHandler);
    socketChannel.on("phx_error", () => setConnected(false));
    socketChannel.on("phx_close", () => setConnected(false));

    return () => {
      socketChannel.off("message:new", handler);
      socketChannel.off("typing", typingHandler);
    };
  }, [socketChannel, chatId, currentUser?.id]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const chatChanged = lastRenderedChatIdRef.current !== chatId;
    const firstRenderForChat = chatChanged || lastRenderedCountRef.current === 0;
    const shouldAutoScroll = firstRenderForChat || shouldStickToBottomRef.current;

    if (shouldAutoScroll) {
      requestAnimationFrame(() => {
        const node = viewportRef.current;
        if (!node) return;
        node.scrollTop = node.scrollHeight;
      });
    }

    lastRenderedChatIdRef.current = chatId;
    lastRenderedCountRef.current = list.length;
  }, [chatId, list.length]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleViewportScroll = () => {
    const el = viewportRef.current;
    if (!el) return;

    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom < 80;
  };

  const submitCurrentMessage = async () => {
    const text = input.trim();

    if (!text && pendingFiles.length === 0) return;

    shouldStickToBottomRef.current = true;
    setIsSending(true);

    try {
      const envelope: Record<string, unknown> = {};

      if (pendingFiles.length > 0) {
        envelope.attachments = pendingFiles;
      }

      await sendMessage(chatId, text, envelope);

      setInput("");
      saveDraft(chatId, "");
      setPendingFiles([]);

      if (socketChannel) {
        socketChannel.push("typing", { typing: false });
      }

      setSomeoneTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    await submitCurrentMessage();
  };

  const handleInputKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await submitCurrentMessage();
    }
  };

  const startChatWithUser = async (userId: number) => {
    const newChat = await startDirectChat(userId);
    setSidebarOpen(false);
    router.push(`/chats/${newChat.id}`);
  };

  const toggleMember = (id: number) => {
    setGroupMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitGroup = async () => {
    const name = groupName.trim();

    if (!name || groupMembers.length === 0) return;

    setGroupBusy(true);

    try {
      const createdChat = await createGroupChat(name, groupMembers);
      setGroupOpen(false);
      setGroupName("");
      setGroupMembers([]);
      setSidebarOpen(false);
      router.push(`/chats/${createdChat.id}`);
    } finally {
      setGroupBusy(false);
    }
  };

  if (!hydrated || !authHydrated || !token) return null;

  const participants =
    chat?.members
      ?.filter((m) => m.id !== currentUser?.id)
      .map((m) => m.display_name || m.username) || [];

  return (
    <AppShell>
      <div className="flex min-h-screen flex-1">
        <div className={`lg:block lg:w-[360px] ${sidebarOpen ? "block" : "hidden"}`}>
          <ChatSidebar
            chats={chats}
            pinned={pinned}
            unread={unread}
            drafts={drafts}
            messages={messages}
            activeId={chatId}
            filter={chatFilter}
            filterMode={filterMode}
            viewMode={viewMode}
            onFilterChange={setChatFilter}
            onFilterModeChange={setFilterMode}
            onViewModeChange={setViewMode}
            onCreateChat={() => setViewMode("friends")}
            onCreateGroupChat={() => {
              setViewMode("chats");
              setGroupOpen(true);
            }}
            onPinToggle={togglePin}
            onStartChatWithUser={startChatWithUser}
          />
        </div>

        <main className="flex min-h-0 flex-1 flex-col bg-[var(--pc-bg)]">
          {groupOpen && (
            <>
              <button
                type="button"
                aria-label="Закрыть создание группы"
                className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
                onClick={() => setGroupOpen(false)}
              />

              <div className="fixed left-2 right-2 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-2xl shadow-black/30 sm:left-1/2 sm:right-auto sm:top-24 sm:w-[520px] sm:-translate-x-1/2">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--pc-border)] p-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">Новая группа</div>
                    <div className="text-xs text-[var(--pc-text-muted)]">
                      Выберите участников из контактов
                    </div>
                  </div>

                  <Button variant="secondary" size="sm" onClick={() => setGroupOpen(false)}>
                    Закрыть
                  </Button>
                </div>

                <div className="space-y-3 p-4">
                  <Input
                    label="Название"
                    placeholder="Например: Друзья"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />

                  <div className="text-sm font-semibold">Участники</div>

                  <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                    {contacts.length === 0 && (
                      <div className="text-sm text-[var(--pc-text-muted)]">
                        Контактов нет — добавьте людей в контакты и создайте группу.
                      </div>
                    )}

                    {contacts.map((c) => {
                      const uid = c.contact_id;
                      const checked = groupMembers.includes(uid);
                      const label = c.user.display_name || c.user.username || `user#${uid}`;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleMember(uid)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left ${
                            checked
                              ? "border-[var(--pc-primary)] bg-[var(--pc-primary)]/10"
                              : "border-[var(--pc-border)] hover:border-[var(--pc-border-strong)] hover:bg-white/5"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{label}</div>
                            <div className="truncate text-xs text-[var(--pc-text-muted)]">
                              {c.user.username} · {c.user.phone}
                            </div>
                          </div>

                          <input type="checkbox" readOnly checked={checked} className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      onClick={submitGroup}
                      disabled={!groupName.trim() || groupMembers.length === 0 || groupBusy}
                    >
                      Создать
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mx-auto flex min-h-0 max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border-b border-[var(--pc-border)] bg-[var(--pc-surface)]/80 px-3 py-3 backdrop-blur sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <IconButton
                  subtle
                  aria-label="Назад"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </IconButton>

                <div className="min-w-0">
                  <div className="truncate text-base font-semibold sm:text-lg">
                    {chat?.name || "Чат"}
                  </div>
                  <div className="truncate text-[11px] text-[var(--pc-text-muted)] sm:text-xs">
                    {someoneTyping
                      ? "печатает…"
                      : participants.length
                        ? participants.join(", ")
                        : "Без названия"}
                  </div>
                </div>

                {isPinned && (
                  <Badge tone="info" variant="soft">
                    Закреплено
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  tone={connected ? "success" : "warning"}
                  variant="soft"
                  className="flex items-center gap-1"
                >
                  {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  {connected ? "Online" : "Offline"}
                </Badge>

                <IconButton
                  subtle
                  aria-label="Закрепить"
                  active={isPinned}
                  onClick={() => togglePin(chatId)}
                >
                  <Pin className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            {!chat && (
              <div className="p-6">
                <Skeleton className="h-12 w-1/2" />
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-10" />
                  ))}
                </div>
              </div>
            )}

            {chat && (
              <>
                <div
                  ref={viewportRef}
                  onScroll={handleViewportScroll}
                  className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-[var(--pc-surface)] via-[var(--pc-bg)] to-[var(--pc-surface-strong)] px-3 py-4 sm:px-4 sm:py-6"
                >
                  {list.map((m: Message) => (
                    <MessageBubble key={m.id ?? m.localId} message={m} />
                  ))}

                  {list.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--pc-border)] py-10 text-center text-sm text-[var(--pc-text-muted)]">
                      Сообщений ещё нет. Напишите что-нибудь первым.
                    </div>
                  )}
                </div>

                <form
                  onSubmit={onSend}
                  className="sticky bottom-0 flex flex-col gap-2 border-t border-[var(--pc-border)] bg-[var(--pc-surface)]/95 px-3 py-3 backdrop-blur sm:px-4"
                >
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {pendingFiles.map((f, idx) => (
                        <span
                          key={`${f.name}-${idx}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-1.5 text-xs"
                        >
                          <span className="max-w-[220px] truncate">{f.name}</span>
                          <span className="text-[10px] text-[var(--pc-text-muted)]">
                            {(f.size / 1024).toFixed(1)} kB
                          </span>
                          <button
                            type="button"
                            aria-label="Убрать файл"
                            className="text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"
                            onClick={() =>
                              setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setPendingFiles((prev) => [
                          ...prev,
                          {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploading: true
                          }
                        ]);

                        try {
                          const uploaded = await uploadFile(file);

                          setPendingFiles((prev) => {
                            const next = [...prev];
                            const idx = next.findIndex(
                              (x) =>
                                x.name === file.name &&
                                x.size === file.size &&
                                x.uploading
                            );

                            const out = uploaded?.file;

                            if (idx >= 0 && out?.url) {
                              next[idx] = {
                                ...next[idx],
                                url: out.url,
                                uploading: false
                              };
                            }

                            return next;
                          });
                        } finally {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }
                      }}
                    />

                    <IconButton
                      type="button"
                      subtle
                      aria-label="Прикрепить файл"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-5 w-5" />
                    </IconButton>

                    <IconButton
                      type="button"
                      subtle
                      aria-label={recording ? "Остановить запись" : "Записать голосовое"}
                      onClick={async () => {
                        if (recording) {
                          mediaRecorderRef.current?.stop();
                          setRecording(false);
                          return;
                        }

                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({
                            audio: true
                          });

                          const rec = new MediaRecorder(stream);
                          recordedChunksRef.current = [];

                          rec.ondataavailable = (ev) => {
                            if (ev.data && ev.data.size > 0) {
                              recordedChunksRef.current.push(ev.data);
                            }
                          };

                          rec.onstop = async () => {
                            stream.getTracks().forEach((t) => t.stop());

                            const blob = new Blob(recordedChunksRef.current, {
                              type: rec.mimeType || "audio/webm"
                            });

                            const file = new File([blob], `voice-${Date.now()}.webm`, {
                              type: blob.type
                            });

                            setPendingFiles((prev) => [
                              ...prev,
                              {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                uploading: true
                              }
                            ]);

                            try {
                              const uploaded = await uploadFile(file);

                              setPendingFiles((prev) => {
                                const next = [...prev];
                                const idx = next.findIndex(
                                  (x) =>
                                    x.name === file.name &&
                                    x.size === file.size &&
                                    x.uploading
                                );

                                const out = uploaded?.file;

                                if (idx >= 0 && out?.url) {
                                  next[idx] = {
                                    ...next[idx],
                                    url: out.url,
                                    uploading: false,
                                    kind: "voice"
                                  };
                                }

                                return next;
                              });
                            } finally {
                              recordedChunksRef.current = [];
                            }
                          };

                          mediaRecorderRef.current = rec;
                          rec.start();
                          setRecording(true);
                        } catch {
                          // пользователь мог запретить доступ к микрофону
                        }
                      }}
                    >
                      {recording ? (
                        <Square className="h-5 w-5 text-rose-200" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </IconButton>

                    <Input
                      placeholder="Напишите сообщение"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        saveDraft(chatId, e.target.value);

                        if (socketChannel) {
                          socketChannel.push("typing", { typing: true });

                          if (typingTimerRef.current) {
                            clearTimeout(typingTimerRef.current);
                          }

                          typingTimerRef.current = setTimeout(() => {
                            socketChannel.push("typing", { typing: false });
                          }, 1200);
                        }
                      }}
                      onKeyDown={handleInputKeyDown}
                    />

                    <Button
                      type="submit"
                      size="sm"
                      className="h-11 flex-shrink-0 px-3 sm:px-4"
                      disabled={(!input.trim() && pendingFiles.length === 0) || isSending}
                    >
                      <Send className="mr-1 h-4 w-4" />
                      Отпр.
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--pc-text-muted)]">
                    <span>
                      {unread[chatId] ? `${unread[chatId]} непрочитанных` : "Все прочитано"}
                    </span>
                    <span>Enter — отправить</span>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </AppShell>
  );
}