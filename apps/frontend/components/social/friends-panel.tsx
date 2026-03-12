"use client";

import { useState } from "react";
import { useFriendsStore } from "@store/friends-store";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { MessageSquare, Phone, Search, UserPlus } from "lucide-react";

type Props = {
  onStartChat?: (userId: number) => void;
};

export function FriendsPanel({ onStartChat }: Props) {
  const { contacts, searchResults, searchUsers, addContact, clearSearch } = useFriendsStore();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleSearch = async () => {
    await searchUsers(query);
  };

  const handleAdd = async (id: number) => {
    setBusyId(id);
    try {
      await addContact(id);
      setQuery("");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 p-4 space-y-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Поиск по номеру или нику</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            prefix={<Phone className="h-4 w-4" />}
            placeholder="+7 999 123-45-67 или username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="secondary" onClick={handleSearch}>
            Найти
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="rounded-lg border border-[var(--pc-border)] bg-[var(--pc-surface)]/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--pc-text-muted)]">
              <span>Результаты</span>
              <button className="underline" onClick={clearSearch}>
                очистить
              </button>
            </div>
            {searchResults.map((r) => {
              const exists = contacts.find((c) => c.contact_id === r.id);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 px-3 py-2"
                >
                  <div>
                    <div className="font-semibold">{r.display_name || r.username}</div>
                    <div className="text-xs text-[var(--pc-text-muted)]">
                      {r.username} · {r.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {exists ? (
                      <Badge tone="success" variant="soft">
                        Уже в контактах
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAdd(r.id)}
                        disabled={busyId === r.id}
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="h-4 w-4" />
                        Добавить
                      </Button>
                    )}
                    <IconButton
                      subtle
                      aria-label="Начать чат"
                      onClick={() => onStartChat?.(r.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Контакты</div>
          <Badge tone="info">{contacts.length}</Badge>
        </div>
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {contacts.length === 0 && (
            <div className="text-sm text-[var(--pc-text-muted)] border border-dashed border-[var(--pc-border)] rounded-xl p-3 text-center">
              Контактов пока нет. Добавьте кого-то по телефону или нику.
            </div>
          )}
          {contacts.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 px-3 py-2"
            >
              <div>
                <div className="font-semibold">{f.user.display_name || f.user.username}</div>
                <div className="text-xs text-[var(--pc-text-muted)]">
                  {f.user.username} · {f.user.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={f.status === "accepted" ? "success" : "info"} variant="soft">
                  {f.status === "accepted" ? "В контактах" : f.status}
                </Badge>
                <IconButton subtle aria-label="Написать" onClick={() => onStartChat?.(f.contact_id)}>
                  <MessageSquare className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
