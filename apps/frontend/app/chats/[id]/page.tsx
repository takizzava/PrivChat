"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@store/auth-store";
import { useChatStore } from "@store/chat-store";
import MessageBubble from "@components/chat/message-bubble";
import { useSocketForChat } from "@lib/socket";
import AppShell from "@components/layout/app-shell";
import { ChatSidebar } from "@components/chat/chat-sidebar";
import { Button } from "@components/ui/button";
import { IconButton } from "@components/ui/icon-button";
import { Badge } from "@components/ui/badge";
import { ArrowLeft, Send, Wifi, WifiOff, Pin, Paperclip, X, Mic, Square } from "lucide-react";
import { Input } from "@components/ui/input";
import { Skeleton } from "@components/ui/skeleton";
import type { Message } from "@t/message";
import { useFriendsStore } from "@store/friends-store";
import { uploadFile } from "@lib/api";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
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
    Array<{ name: string; type?: string; size: number; url?: string; uploading?: boolean; kind?: string }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<any>(null);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const chatId = Number(params.id);
  const socketChannel = useSocketForChat(chatId);
  const list = messages[chatId] || [];
  const chat = chats.find((c) => c.id === chatId);
  const isPinned = pinned.includes(chatId);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    loadChats().catch(() => {});
    loadContacts().catch(() => {});
    loadMessages(chatId).then(() => markRead(chatId));
    setInput(drafts[chatId] ?? "");
  }, [hydrated, token, router, chatId, loadMessages, drafts, loadChats, markRead]);

  useEffect(() => {
    if (!hydrated) return;
    markRead(chatId);
  }, [chatId, hydrated, markRead, list.length]);

  useEffect(() => {
    if (!socketChannel) return;
    setConnected(true);

    const handler = (payload: any) => {
      useChatStore.getState().appendMessage(chatId, payload);
    };
    const typingHandler = (payload: any) => {
      if (!payload) return;
      if (payload.chat_id !== chatId) return;
      if (payload.user_id === currentUser?.id) return;
      setSomeoneTyping(!!payload.typing);
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
    el.scrollTop = el.scrollHeight;
  }, [messages[chatId]?.length]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    setIsSending(true);
    try {
      const envelope: Record<string, unknown> = {};
      if (pendingFiles.length > 0) envelope.attachments = pendingFiles;
      await sendMessage(chatId, text, envelope);
      setInput("");
      saveDraft(chatId, "");
      setPendingFiles([]);
      if (socketChannel) socketChannel.push("typing", { typing: false });
      setSomeoneTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  if (!hydrated || !token) return null;

  const participants =
    chat?.members?.filter((m) => m.id !== currentUser?.id).map((m) => m.display_name || m.username) ||
    [];

  const startChatWithUser = async (userId: number) => {
    const newChat = await startDirectChat(userId);
    setSidebarOpen(false);
    router.push(`/chats/${newChat.id}`);
  };

  const toggleMember = (id: number) => {
    setGroupMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submitGroup = async () => {
    const name = groupName.trim();
    if (!name || groupMembers.length === 0) return;
    setGroupBusy(true);
    try {
      const chat = await createGroupChat(name, groupMembers);
      setGroupOpen(false);
      setGroupName("");
      setGroupMembers([]);
      setSidebarOpen(false);
      router.push(`/chats/${chat.id}`);
    } finally {
      setGroupBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-1 min-h-screen">
        <div className={`lg:block ${sidebarOpen ? "block" : "hidden"} lg:w-[360px]`}>
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

        <main className="flex-1 flex flex-col bg-[var(--pc-bg)]">
          {groupOpen && (
            <>
              <button
                type="button"
                aria-label="Закрыть создание группы"
                className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-40"
                onClick={() => setGroupOpen(false)}
              />
              <div className="fixed z-50 left-2 right-2 top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-2xl shadow-black/30 sm:left-1/2 sm:right-auto sm:top-24 sm:w-[520px] sm:-translate-x-1/2">
                <div className="p-4 border-b border-[var(--pc-border)] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">Новая группа</div>
                    <div className="text-xs text-[var(--pc-text-muted)]">
                      Выберите участников из контактов
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setGroupOpen(false)}>
                    Закрыть
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  <Input
                    label="Название"
                    placeholder="Например: Друзья"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <div className="text-sm font-semibold">Участники</div>
                  <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-1">
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
                          className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left ${
                            checked
                              ? "border-[var(--pc-primary)] bg-[var(--pc-primary)]/10"
                              : "border-[var(--pc-border)] hover:border-[var(--pc-border-strong)] hover:bg-white/5"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{label}</div>
                            <div className="text-xs text-[var(--pc-text-muted)] truncate">
                              {c.user.username} · {c.user.phone}
                            </div>
                          </div>
                          <input type="checkbox" readOnly checked={checked} className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
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
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[var(--pc-border)] bg-[var(--pc-surface)]/80 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <IconButton
                subtle
                aria-label="Назад"
                className="lg:hidden"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <ArrowLeft className="h-5 w-5" />
              </IconButton>
              <div className="min-w-0">
                <div className="font-semibold text-base sm:text-lg truncate">{chat?.name || "Чат"}</div>
                <div className="text-[11px] sm:text-xs text-[var(--pc-text-muted)] truncate">
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
              <Badge tone={connected ? "success" : "warning"} variant="soft" className="flex items-center gap-1">
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
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 bg-gradient-to-b from-[var(--pc-surface)] via-[var(--pc-bg)] to-[var(--pc-surface-strong)]"
              >
                {list.map((m: Message) => (
                  <MessageBubble key={m.id ?? m.localId} message={m} />
                ))}
                {list.length === 0 && (
                  <div className="text-center text-sm text-[var(--pc-text-muted)] py-10 border border-dashed border-[var(--pc-border)] rounded-xl">
                    Сообщений ещё нет. Напишите что-нибудь первым.
                  </div>
                )}
              </div>

              <form
                onSubmit={onSend}
                className="border-t border-[var(--pc-border)] bg-[var(--pc-surface)]/95 backdrop-blur px-3 sm:px-4 py-3 flex flex-col gap-2 sticky bottom-0"
              >
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {pendingFiles.map((f, idx) => (
                      <span
                        key={`${f.name}-${idx}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-1.5 text-xs"
                      >
                        <span className="truncate max-w-[220px]">{f.name}</span>
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
                      // оптимистично добавляем, затем грузим
                      setPendingFiles((prev) => [
                        ...prev,
                        { name: file.name, type: file.type, size: file.size, uploading: true }
                      ]);
                      try {
                        const uploaded = await uploadFile(file);
                        setPendingFiles((prev) => {
                          const next = [...prev];
                          const idx = next.findIndex((x) => x.name === file.name && x.size === file.size && x.uploading);
                          const out = uploaded?.file;
                          if (idx >= 0 && out?.url) {
                            next[idx] = { ...next[idx], url: out.url, uploading: false };
                          }
                          return next;
                        });
                      } finally {
                        // даём выбрать тот же файл ещё раз
                        if (fileInputRef.current) fileInputRef.current.value = "";
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
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const rec = new MediaRecorder(stream);
                        recordedChunksRef.current = [];
                        rec.ondataavailable = (ev) => {
                          if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
                        };
                        rec.onstop = async () => {
                          stream.getTracks().forEach((t) => t.stop());
                          const blob = new Blob(recordedChunksRef.current, { type: rec.mimeType || "audio/webm" });
                          const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
                          setPendingFiles((prev) => [
                            ...prev,
                            { name: file.name, type: file.type, size: file.size, uploading: true }
                          ]);
                          try {
                            const uploaded = await uploadFile(file);
                            setPendingFiles((prev) => {
                              const next = [...prev];
                              const idx = next.findIndex((x) => x.name === file.name && x.size === file.size && x.uploading);
                              const out = uploaded?.file;
                              if (idx >= 0 && out?.url) {
                                next[idx] = {
                                  ...next[idx],
                                  url: out.url,
                                  uploading: false,
                                  // пометка, чтобы MessageBubble показал аудио-плеер
                                  kind: "voice"
                                } as any;
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
                        // игнор: пользователь мог запретить микрофон
                      }
                    }}
                  >
                    {recording ? <Square className="h-5 w-5 text-rose-200" /> : <Mic className="h-5 w-5" />}
                  </IconButton>
                  <Input
                    placeholder="Напишите сообщение"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      saveDraft(chatId, e.target.value);
                      if (socketChannel) {
                        socketChannel.push("typing", { typing: true });
                        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                        typingTimerRef.current = setTimeout(() => {
                          socketChannel.push("typing", { typing: false });
                        }, 1200);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        // иначе срабатывают и onKeyDown, и onSubmit (двойная отправка)
                        e.preventDefault();
                        onSend(e as any);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-11 px-3 sm:px-4 flex-shrink-0"
                    disabled={(!input.trim() && pendingFiles.length === 0) || isSending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Отпр.
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--pc-text-muted)]">
                  <span>{unread[chatId] ? `${unread[chatId]} непрочитанных` : "Все прочитано"}</span>
                  <span>Enter — отправить</span>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
}
