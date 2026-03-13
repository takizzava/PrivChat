"use client";

import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@store/auth-store";
import { useChatStore } from "@store/chat-store";
import { useFriendsStore } from "@store/friends-store";
import AppShell from "@components/layout/app-shell";
import { ChatSidebar } from "@components/chat/chat-sidebar";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Layers, Sparkles, UserPlus } from "lucide-react";
import { Skeleton } from "@components/ui/skeleton";

export default function ChatsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const {
    loadChats,
    startDirectChat,
    chats,
    pinned,
    togglePin,
    unread,
    messages,
    drafts
  } = useChatStore();
  const { loadContacts } = useFriendsStore();
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "pinned">("all");
  const [viewMode, setViewMode] = useState<"chats" | "friends">("chats");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !authHydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setLoadError(null);
        await Promise.all([loadChats(), loadContacts()]);
      } catch (error) {
        const status = (error as AxiosError)?.response?.status;
        if (status === 401) {
          router.replace("/login");
          return;
        }
        setLoadError("Не удалось загрузить чаты, попробуйте позже.");
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrated, authHydrated, token, router, loadChats, loadContacts]);

  const stats = useMemo(() => {
    const unreadCount = Object.values(unread).reduce((acc, v) => acc + (v ?? 0), 0);
    return {
      total: chats.length,
      unread: unreadCount,
      pinned: pinned.length
    };
  }, [chats.length, pinned.length, unread]);

  if (!hydrated || !authHydrated || !token) return null;

  const handleStartChat = async (userId: number) => {
    const chat = await startDirectChat(userId);
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
          onCreateChat={() => setViewMode("friends")}
          onPinToggle={togglePin}
          onStartChatWithUser={handleStartChat}
        />

        <main className="flex-1 bg-gradient-to-br from-[var(--pc-surface)] via-[var(--pc-bg)] to-[var(--pc-surface-strong)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-sm text-[var(--pc-text-muted)]">
                  Готовые к старту диалоги и контакты
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold">Ваши чаты</h1>
              </div>
              <Badge tone="info" variant="soft" className="hidden sm:inline-flex">
                online-ready
              </Badge>
              <Badge tone="success" variant="soft" className="hidden sm:inline-flex">
                realtime
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: "Чатов", value: stats.total, icon: Layers, color: "from-indigo-500 to-sky-500" },
                { label: "Непрочитанных", value: stats.unread, icon: Sparkles, color: "from-amber-400 to-orange-500" },
                { label: "Закреплено", value: stats.pinned, icon: UserPlus, color: "from-emerald-500 to-teal-400" }
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
                <div className="bg-[var(--pc-surface-subtle)]/60 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                  <h2 className="text-xl font-semibold">Начните диалог</h2>
                  <p className="text-sm text-[var(--pc-text-muted)]">
                    Добавьте контакт по номеру или нику, откройте чат и пишите без перезагрузки.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton subtle aria-label="Новый чат" onClick={() => setViewMode("friends")}>
                    <UserPlus className="h-5 w-5" />
                  </IconButton>
                  <Button size="sm" onClick={() => setViewMode("friends")}>
                    Добавить контакт
                  </Button>
                </div>
              </div>
              {loading && (
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 sm:h-20 rounded-2xl" />
                  ))}
                </div>
              )}
              {loadError && (
                <div className="p-4 sm:p-6 text-sm text-rose-400">{loadError}</div>
              )}
              {!loading && (
                <div className="p-4 sm:p-6 text-sm text-[var(--pc-text-muted)]">
                  Выберите чат слева или найдите человека во вкладке «Контакты».
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
