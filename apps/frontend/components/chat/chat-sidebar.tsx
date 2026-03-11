"use client";

import { useMemo } from "react";
import ChatList from "./chat-list";
import { Chat } from "@types/chat";
import { Message } from "@types/message";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { SegmentedControl } from "@components/ui/segmented";
import { Plus, Search } from "lucide-react";
import { FriendsPanel } from "@components/social/friends-panel";

type Filter = "all" | "unread" | "pinned";

interface Props {
  chats: Chat[];
  messages: Record<number, Message[]>;
  pinned: number[];
  unread: Record<number, number>;
  drafts: Record<number, string>;
  activeId?: number;
  filter: string;
  filterMode: Filter;
  viewMode?: "chats" | "friends";
  onFilterChange: (value: string) => void;
  onFilterModeChange: (mode: Filter) => void;
  onViewModeChange?: (mode: "chats" | "friends") => void;
  onCreateChat: () => void;
  onPinToggle: (chatId: number) => void;
}

export function ChatSidebar({
  chats,
  messages,
  pinned,
  unread,
  drafts,
  activeId,
  filter,
  filterMode,
  viewMode = "chats",
  onFilterChange,
  onFilterModeChange,
  onViewModeChange,
  onCreateChat,
  onPinToggle
}: Props) {
  const filtered = useMemo(() => {
    const bySearch = chats.filter((c) =>
      c.name.toLowerCase().includes(filter.toLowerCase())
    );
    if (filterMode === "pinned") return bySearch.filter((c) => pinned.includes(c.id));
    if (filterMode === "unread")
      return bySearch.filter((c) => (unread[c.id] ?? 0) > 0);
    return bySearch;
  }, [chats, filter, filterMode, pinned, unread]);

  return (
    <aside className="w-full lg:w-[360px] border-r border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 backdrop-blur-xl flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[var(--pc-border)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm text-[var(--pc-text-muted)]">
              {viewMode === "friends" ? "Контакты" : "Чаты"}
            </p>
            <h2 className="text-xl font-semibold">
              {viewMode === "friends" ? "Друзья и поиск" : "Входящие"}
            </h2>
          </div>
          <Button size="sm" onClick={onCreateChat} className="shrink-0">
            <Plus className="h-4 w-4" />
            Новый чат
          </Button>
        </div>
        <SegmentedControl
          options={[
            { label: "Чаты", value: "chats" },
            { label: "Друзья", value: "friends" }
          ]}
          value={viewMode}
          onChange={(val) => onViewModeChange?.(val as "chats" | "friends")}
        />
        {viewMode === "chats" && (
          <>
            <Input
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Поиск по людям и группам"
              prefix={<Search className="h-4 w-4" />}
            />
            <SegmentedControl
              options={[
                { label: "Все", value: "all" },
                { label: "Непрочитанные", value: "unread" },
                { label: "Закреплённые", value: "pinned" }
              ]}
              value={filterMode}
              onChange={(val) => onFilterModeChange(val as Filter)}
            />
          </>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {viewMode === "friends" ? (
          <FriendsPanel />
        ) : (
          <ChatList
            chats={filtered}
            pinnedIds={pinned}
            unread={unread}
            drafts={drafts}
            messages={messages}
            activeId={activeId}
            onPinToggle={onPinToggle}
          />
        )}
      </div>
    </aside>
  );
}
