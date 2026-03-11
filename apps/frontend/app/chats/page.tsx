"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@store/auth-store";
import { useChatStore } from "@store/chat-store";
import AppShell from "@components/layout/app-shell";
import { ChatSidebar } from "@components/chat/chat-sidebar";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Layers, Lock, Shield, Sparkles } from "lucide-react";
import { Skeleton } from "@components/ui/skeleton";

export default function ChatsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const {
    loadChats,
    createChat,
    chats,
    pinned,
    togglePin,
    unread,
    messages,
    drafts
  } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "pinned">("all");
  const [viewMode, setViewMode] = useState<"chats" | "friends">("chats");
  const [newChatName, setNewChatName] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      await loadChats();
      setLoading(false);
    })();
  }, [hydrated, token, router, loadChats]);

  const stats = useMemo(() => {
    const unreadCount = Object.values(unread).reduce((acc, v) => acc + (v ?? 0), 0);
    return {
      total: chats.length,
      unread: unreadCount,
      pinned: pinned.length
    };
  }, [chats.length, pinned.length, unread]);

  if (!hydrated || !token) return null;

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;
    const chat = await createChat(newChatName.trim());
    setShowNewChat(false);
    setNewChatName("");
    router.push(`/chats/${chat.id}`);
  };

  return (
    <AppShell>
      <div className="flex flex-1 min-h-screen">
        <ChatSidebar
          chats={chats}
          pinned={pinned}
          unread={unread}
          drafts={drafts}
          messages={messages}
          activeId={undefined}
          filter={filter}
          filterMode={filterMode}
          viewMode={viewMode}
          onFilterChange={setFilter}
          onFilterModeChange={setFilterMode}
          onViewModeChange={setViewMode}
          onCreateChat={() => setShowNewChat(true)}
          onPinToggle={togglePin}
        />

        <main className="flex-1 bg-gradient-to-br from-[var(--pc-surface)] via-[var(--pc-bg)] to-[var(--pc-surface-strong)]">
          <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-sm text-[var(--pc-text-muted)]">
                  Добро пожаловать в обновлённый PrivChat
                </p>
                <h1 className="text-3xl font-semibold">Ваш центр сообщений</h1>
              </div>
              <Badge tone="info" variant="soft">
                Мгновенная синхронизация
              </Badge>
              <Badge tone="success" variant="soft">
                Безопасные беседы
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Всего чатов", value: stats.total, icon: Layers, color: "from-indigo-500 to-sky-500" },
                { label: "Непрочитанные", value: stats.unread, icon: Sparkles, color: "from-amber-400 to-orange-500" },
                { label: "Закреплено", value: stats.pinned, icon: Shield, color: "from-emerald-500 to-teal-400" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 p-4 shadow-sm flex items-center gap-3"
                >
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md shadow-black/20`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm text-[var(--pc-text-muted)]">{item.label}</div>
                    <div className="text-2xl font-semibold">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 shadow-lg overflow-hidden">
              <div className="bg-[var(--pc-surface-subtle)]/60 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Быстрый старт</h2>
                  <p className="text-sm text-[var(--pc-text-muted)]">
                    Создайте чат и попробуйте обновлённый UX: черновики, закрепления, фильтры.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton subtle aria-label="Безопасность">
                    <Lock className="h-5 w-5" />
                  </IconButton>
                  <Button onClick={() => setShowNewChat(true)}>Новый чат</Button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Поиск по диалогам и статусам",
                  "Черновики сообщений сохраняются локально",
                  "Закрепляйте важные диалоги",
                  "Десктоп и мобайл адаптивны"
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-start gap-3 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/60 p-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[var(--pc-primary)]/15 text-[var(--pc-primary)] flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--pc-text)]">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-20 rounded-2xl" />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Создать новый чат</h3>
                <p className="text-sm text-[var(--pc-text-muted)]">
                  Дайте ему имя — вы сможете сменить его позже.
                </p>
              </div>
              <Badge tone="info">В реальном времени</Badge>
            </div>
            <input
              className="w-full rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--pc-primary)] focus:shadow-[0_0_0_1px_var(--pc-primary)]"
              placeholder="Например: Команда продукта"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewChat(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateChat} disabled={!newChatName.trim()}>
                Создать
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
