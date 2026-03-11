"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@store/auth-store";
import { useChatStore } from "@store/chat-store";
import MessageBubble from "@components/chat/message-bubble";
import { useSocketForChat } from "@lib/socket";
import AppShell from "@components/layout/app-shell";
import { ChatSidebar } from "@components/chat/chat-sidebar";
import { Button } from "@components/ui/button";
import { IconButton } from "@components/ui/icon-button";
import { Badge } from "@components/ui/badge";
import {
  ArrowLeft,
  Link2,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
  Mic,
  Pin,
  WifiOff,
  Wifi,
  Menu,
  X
} from "lucide-react";
import { Input } from "@components/ui/input";
import { Skeleton } from "@components/ui/skeleton";
import { Message } from "@types/message";

type FilterMode = "all" | "unread" | "pinned";

type ComposerAttachment = {
  name: string;
  size: number;
  type: string;
  kind?: "file" | "voice" | "sticker";
  url?: string;
};

const STICKERS = ["🔥", "🚀", "👍", "❤️", "🎉", "✨", "😎", "🤝"];

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
    markRead
  } = useChatStore();
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [messageFilter, setMessageFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [connected, setConnected] = useState(true);
  const [viewMode, setViewMode] = useState<"chats" | "friends">("chats");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [customSticker, setCustomSticker] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastMessageCount = useRef(0);

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

    socketChannel.on("message:new", handler);
    socketChannel.on("phx_error", () => setConnected(false));
    socketChannel.on("phx_close", () => setConnected(false));

    return () => {
      socketChannel.off("message:new", handler);
    };
  }, [socketChannel, chatId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages[chatId]?.length]);

  // Уведомления о новых сообщениях
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!hydrated || list.length === lastMessageCount.current) return;
    const last = list[list.length - 1];
    lastMessageCount.current = list.length;
    if (!last || last.sender_id === currentUser?.id) return;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(chat?.name ?? "Новое сообщение", {
        body: last.body || "Новое сообщение",
        silent: false
      });
    }
  }, [list, hydrated, chat?.name, currentUser?.id]);

  const filteredMessages = useMemo(() => {
    if (!messageFilter.trim()) return list;
    const f = messageFilter.toLowerCase();
    return list.filter((m) => m.body.toLowerCase().includes(f));
  }, [list, messageFilter]);

  const grouped = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    filteredMessages.forEach((m) => {
      const dateKey = new Date(m.inserted_at).toDateString();
      const last = groups[groups.length - 1];
      if (!last || last.date !== dateKey) {
        groups.push({ date: dateKey, items: [m] });
      } else {
        last.items.push(m);
      }
    });
    return groups;
  }, [filteredMessages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = selectedSticker ? `[Стикер] ${selectedSticker}` : input.trim();
    if (!text && attachments.length === 0) return;
    setIsSending(true);
    const envelope: Record<string, unknown> = {
      reply_to: replyTo
        ? {
            body: replyTo.body,
            sender: replyTo.sender_id
          }
        : undefined,
      attachments: attachments.length ? attachments : undefined,
      sticker: selectedSticker || undefined
    };
    try {
      await sendMessage(chatId, text || "Вложение", envelope);
      if (socketChannel) {
        socketChannel.push("message:new", {
          body: text || "Вложение",
          encrypted: false,
          envelope_metadata: envelope
        });
      }
      if (replyTo) setReplyTo(null);
      setInput("");
      setAttachments([]);
      setSelectedSticker(null);
      saveDraft(chatId, "");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    saveDraft(chatId, value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const mapped: ComposerAttachment[] = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || "file",
      kind: "file",
      url: URL.createObjectURL(f)
    }));
    setAttachments((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  const stopMediaRecorder = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      stopMediaRecorder();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const voice: ComposerAttachment = {
          name: `voice-${Date.now()}.webm`,
          size: blob.size,
          type: "audio/webm",
          kind: "voice",
          url
        };
        setAttachments((prev) => [...prev, voice]);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Не удалось получить доступ к микрофону", err);
      setRecording(false);
    }
  };

  const ready = hydrated && !!token;

  return (
    <AppShell>
      <div className="flex flex-1 min-h-screen flex-col lg:flex-row">
        <div className="hidden lg:block">
          <ChatSidebar
            chats={chats}
            pinned={pinned}
            unread={unread}
            drafts={drafts}
            messages={messages}
            activeId={chatId}
            filter={filter}
            filterMode={filterMode}
            viewMode={viewMode}
            onFilterChange={setFilter}
            onFilterModeChange={setFilterMode}
            onViewModeChange={setViewMode}
            onCreateChat={() => router.push("/chats")}
            onPinToggle={togglePin}
          />
        </div>

        <main className="flex-1 flex flex-col bg-[var(--pc-bg)] relative">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[var(--pc-border)] bg-[var(--pc-surface)]/90 backdrop-blur px-4 py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <IconButton
                subtle
                aria-label="Показать список"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </IconButton>
              <IconButton
                subtle
                aria-label="Назад"
                className="lg:hidden"
                onClick={() => router.push("/chats")}
              >
                <ArrowLeft className="h-5 w-5" />
              </IconButton>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold truncate">
                    {chat?.name ?? `Диалог #${chatId}`}
                  </h1>
                  {unread[chatId] ? (
                    <Badge tone="warning" variant="soft">
                      {unread[chatId]} новых
                    </Badge>
                  ) : null}
                  {isPinned && (
                    <Badge tone="info" variant="soft">
                      Закреплено
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--pc-text-muted)]">
                  {connected
                    ? "Подключено к серверу, обновления в реальном времени."
                    : "Нет связи: сообщения отправятся, как только появится интернет."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                subtle
                aria-label="Закрепить чат"
                active={isPinned}
                onClick={() => togglePin(chatId)}
              >
                <Pin className="h-5 w-5" />
              </IconButton>
              <IconButton subtle aria-label="Ссылки и файлы">
                <Link2 className="h-5 w-5" />
              </IconButton>
              <IconButton subtle aria-label="Дополнительные действия">
                <MoreHorizontal className="h-5 w-5" />
              </IconButton>
              <Badge
                tone={connected ? "success" : "danger"}
                variant="soft"
                className="hidden md:inline-flex"
              >
                {connected ? (
                  <span className="flex items-center gap-1">
                    <Wifi className="h-4 w-4" /> Онлайн
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <WifiOff className="h-4 w-4" /> Офлайн
                  </span>
                )}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--pc-border)] bg-[var(--pc-surface-subtle)]/60 flex flex-wrap items-center gap-3">
              <Input
                value={messageFilter}
                onChange={(e) => setMessageFilter(e.target.value)}
                placeholder="Искать по сообщениям и упоминаниям"
                prefix={<Search className="h-4 w-4" />}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMessageFilter("")}
                className="shrink-0"
              >
                Сбросить фильтр
              </Button>
            </div>

            <div
              ref={viewportRef}
              className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-6"
            >
              {!ready && (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-1/3 rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-3/4 rounded-2xl" />
                </div>
              )}

              {ready && grouped.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16 gap-3 text-[var(--pc-text-muted)]">
                  <Search className="h-10 w-10" />
                  <p className="text-sm">Сообщения не найдены. Напишите первое.</p>
                </div>
              )}

              {ready &&
                grouped.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[var(--pc-border)]" />
                      <div className="text-xs text-[var(--pc-text-muted)]">
                        {new Date(group.date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "long"
                        })}
                      </div>
                      <div className="flex-1 h-px bg-[var(--pc-border)]" />
                    </div>
                    <div className="space-y-2">
                      {group.items.map((m) => (
                        <MessageBubble key={m.id ?? m.localId} message={m} onReply={setReplyTo} />
                      ))}
                    </div>
                  </div>
                ))}

              {isSending && ready && (
                <div className="flex justify-end">
                  <Skeleton className="h-12 w-40 rounded-2xl" />
                </div>
              )}
            </div>

            <div className="border-t border-[var(--pc-border)] bg-[var(--pc-surface)]/80 backdrop-blur px-3 md:px-6 py-3 space-y-3">
              {replyTo && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-2">
                  <div className="text-xs text-[var(--pc-text-muted)] flex-1">
                    Ответ на:{" "}
                    <span className="text-[var(--pc-text)]">{replyTo.body.slice(0, 120)}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                    Отмена
                  </Button>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <div
                      key={`${a.name}-${a.size}`}
                      className="flex items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-1 text-xs"
                    >
                      <span className="font-semibold">{a.kind === "voice" ? "Голос" : "Файл"}</span>
                      <span className="truncate max-w-[120px]">{a.name}</span>
                      <IconButton subtle size="sm" aria-label="Удалить" onClick={() => removeAttachment(a.name)}>
                        <X className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--pc-text-muted)]">Стикеры:</span>
                  {STICKERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSticker(s)}
                      className={`h-9 w-9 rounded-lg border text-lg transition ${
                        selectedSticker === s
                          ? "border-[var(--pc-primary)] bg-[var(--pc-primary)]/10"
                          : "border-[var(--pc-border)] bg-[var(--pc-surface-strong)] hover:border-[var(--pc-primary)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  {selectedSticker && (
                    <Button size="sm" variant="ghost" onClick={() => setSelectedSticker(null)}>
                      Очистить
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Создать свой стикер"
                    value={customSticker}
                    onChange={(e) => setCustomSticker(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (!customSticker.trim()) return;
                      setSelectedSticker(customSticker.trim());
                      setCustomSticker("");
                    }}
                  >
                    Добавить
                  </Button>
                </div>
              </div>

              <form onSubmit={onSend} className="flex items-end gap-3">
                <div className="flex md:hidden items-center gap-2">
                  <IconButton subtle aria-label="Прикрепить файл" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                  </IconButton>
                  <IconButton subtle aria-label="Смайлы">
                    <Smile className="h-5 w-5" />
                  </IconButton>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <IconButton subtle aria-label="Прикрепить файл" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                  </IconButton>
                  <IconButton subtle aria-label="Смайлы">
                    <Smile className="h-5 w-5" />
                  </IconButton>
                  <IconButton subtle aria-label="Голосовое сообщение" active={recording} onClick={toggleRecording}>
                    <Mic className="h-5 w-5" />
                  </IconButton>
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full min-h-[60px] max-h-[160px] resize-none rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-4 py-3 text-sm text-[var(--pc-text)] placeholder:text-[var(--pc-text-muted)] focus:outline-none focus:border-[var(--pc-primary)] focus:shadow-[0_0_0_1px_var(--pc-primary)]"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Напишите сообщение, используйте @, чтобы упомянуть"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--pc-text-muted)]">
                    <span>Черновик сохраняется автоматически</span>
                    <span>Shift + Enter для новой строки</span>
                  </div>
                </div>
                <Button type="submit" disabled={(!input.trim() && attachments.length === 0 && !selectedSticker) || !ready} className="shrink-0">
                  {isSending ? (
                    "Отправка..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Отправить
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </form>
              {recording && (
                <div className="text-xs text-[var(--pc-text-muted)] flex items-center gap-2">
                  Идёт запись голоса...
                  <span className="animate-pulse h-2 w-2 rounded-full bg-red-400" />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-[88%] max-w-[420px] bg-[var(--pc-surface)] shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatSidebar
              chats={chats}
              pinned={pinned}
              unread={unread}
              drafts={drafts}
              messages={messages}
              activeId={chatId}
              filter={filter}
              filterMode={filterMode}
              viewMode={viewMode}
              onFilterChange={setFilter}
              onFilterModeChange={setFilterMode}
              onViewModeChange={setViewMode}
              onCreateChat={() => {
                setSidebarOpen(false);
                router.push("/chats");
              }}
              onPinToggle={togglePin}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
