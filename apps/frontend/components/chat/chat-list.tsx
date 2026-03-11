"use client";

import Link from "next/link";
import { Chat } from "@types/chat";
import { Avatar } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Pin, Clock3, MessageSquare, Pencil } from "lucide-react";
import { Message } from "@types/message";
import { cn } from "@lib/utils";

interface Props {
  chats: Chat[];
  pinnedIds: number[];
  unread: Record<number, number>;
  drafts: Record<number, string>;
  messages: Record<number, Message[]>;
  activeId?: number;
  onPinToggle: (chatId: number) => void;
  emptyLabel?: string;
}

function ChatPreview({
  chat,
  unread,
  isPinned,
  draft,
  lastMessage,
  active,
  onPinToggle
}: {
  chat: Chat;
  unread?: number;
  isPinned: boolean;
  draft?: string;
  lastMessage?: Message;
  active: boolean;
  onPinToggle: () => void;
}) {
  const subtitle = draft
    ? `Черновик: ${draft.slice(0, 40)}`
    : lastMessage
    ? lastMessage.body.slice(0, 80)
    : "Пока нет сообщений — начните диалог";

  return (
    <Link
      href={`/chats/${chat.id}`}
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-3 py-3 transition-all",
        active
          ? "border-[var(--pc-primary)] bg-[var(--pc-primary)]/10 shadow-sm"
          : "border-[var(--pc-border)] hover:border-[var(--pc-border-strong)] hover:bg-white/5"
      )}
    >
      <Avatar name={chat.name} size="sm" indicator={unread ? "online" : "none"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold truncate">{chat.name}</div>
          {isPinned && (
            <Badge variant="soft" tone="info" className="uppercase text-[10px]">
              Закреплён
            </Badge>
          )}
          {draft && (
            <Badge tone="warning" variant="soft" className="uppercase text-[10px]">
              Черновик
            </Badge>
          )}
        </div>
        <div className="mt-1 text-sm text-[var(--pc-text-muted)] flex items-center gap-2">
          {lastMessage ? <MessageSquare className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          <span className="truncate">{subtitle}</span>
        </div>
        <div className="mt-1 text-[11px] text-[var(--pc-text-muted)] flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5" />
          <span>
            {new Date(chat.inserted_at).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "2-digit"
            })}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <IconButton
          aria-label={isPinned ? "Открепить чат" : "Закрепить чат"}
          size="sm"
          subtle
          active={isPinned}
          onClick={(e) => {
            e.preventDefault();
            onPinToggle();
          }}
        >
          <Pin className="h-4 w-4" />
        </IconButton>
        {unread ? (
          <Badge variant="solid">{unread > 99 ? "99+" : unread}</Badge>
        ) : null}
      </div>
    </Link>
  );
}

export default function ChatList({
  chats,
  pinnedIds,
  unread,
  drafts,
  messages,
  activeId,
  onPinToggle,
  emptyLabel = "Нет чатов — создайте первый"
}: Props) {
  if (!chats.length) {
    return (
      <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-4 py-6 text-sm text-[var(--pc-text-muted)]">
        {emptyLabel}
      </div>
    );
  }

  const pinned = chats.filter((c) => pinnedIds.includes(c.id));
  const regular = chats.filter((c) => !pinnedIds.includes(c.id));

  const renderList = (list: Chat[], label?: string) => (
    <div className="space-y-2">
      {label && (
        <div className="text-xs uppercase tracking-wide text-[var(--pc-text-muted)] px-1">
          {label}
        </div>
      )}
      <div className="space-y-2">
        {list.map((chat) => (
          <ChatPreview
            key={chat.id}
            chat={chat}
            isPinned={pinnedIds.includes(chat.id)}
            unread={unread[chat.id]}
            draft={drafts[chat.id]}
            lastMessage={messages[chat.id]?.slice(-1)[0]}
            active={activeId === chat.id}
            onPinToggle={() => onPinToggle(chat.id)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {pinned.length ? renderList(pinned, "Закреплённые") : null}
      {renderList(regular, pinned.length ? "Все чаты" : undefined)}
    </div>
  );
}
