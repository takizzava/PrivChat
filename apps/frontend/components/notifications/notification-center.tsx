"use client";

import { useNotificationStore } from "@store/notification-store";
import { Bell, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import Link from "next/link";

export function NotificationCenter() {
  const { items, markAllRead, clear, markRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="relative">
      <IconButton subtle aria-label="Уведомления" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-[var(--pc-primary)] text-[10px] text-white flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </IconButton>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] shadow-2xl shadow-black/30 p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Уведомления</span>
              <Badge tone="info">{unread} новых</Badge>
            </div>
            <div className="flex items-center gap-2">
              <IconButton subtle size="sm" aria-label="Пометить прочитанными" onClick={markAllRead}>
                <Check className="h-4 w-4" />
              </IconButton>
              <IconButton subtle size="sm" aria-label="Очистить" onClick={clear}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {items.length === 0 && (
              <div className="text-sm text-[var(--pc-text-muted)]">Нет уведомлений</div>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  n.read ? "border-[var(--pc-border)]" : "border-[var(--pc-primary)]/60 bg-[var(--pc-primary)]/5"
                }`}
                onMouseEnter={() => markRead(n.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{n.title}</span>
                  <span className="text-[10px] text-[var(--pc-text-muted)]">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[var(--pc-text-muted)]">{n.body}</div>
                {n.chatId && (
                  <Link
                    href={`/chats/${n.chatId}`}
                    className="text-[11px] text-[var(--pc-primary)] hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Открыть чат
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
