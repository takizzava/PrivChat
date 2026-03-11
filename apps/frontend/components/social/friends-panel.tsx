"use client";

import { useState } from "react";
import { useFriendsStore } from "@store/friends-store";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Check, Phone, UserPlus, X } from "lucide-react";

export function FriendsPanel() {
  const { friends, searchResults, searchByPhone, sendRequest, acceptRequest, block, remove } =
    useFriendsStore();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const handleSearch = () => {
    if (!phone.trim()) return;
    searchByPhone(phone.trim());
  };

  const handleSend = (p: string, n?: string) => {
    sendRequest(n || "Контакт", p);
    setPhone("");
    setName("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 p-4 space-y-3">
        <div className="text-sm font-semibold">Поиск по номеру телефона</div>
        <div className="flex flex-col gap-2">
          <Input
            prefix={<Phone className="h-4 w-4" />}
            placeholder="+7 999 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            placeholder="Имя контакта"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSearch} className="flex-1">
              Найти
            </Button>
            <Button onClick={() => handleSend(phone, name)} disabled={!phone.trim()} className="flex-1">
              Добавить
            </Button>
          </div>
        </div>
        {searchResults.length > 0 && (
          <div className="rounded-lg border border-[var(--pc-border)] bg-white/5 p-3 space-y-2">
            <div className="text-xs text-[var(--pc-text-muted)]">Результаты</div>
            {searchResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-[var(--pc-text-muted)]">{r.phone}</div>
                </div>
                <Button size="sm" onClick={() => handleSend(r.phone, r.name)}>
                  Отправить заявку
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Мои контакты</div>
          <Badge tone="info">{friends.length}</Badge>
        </div>
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {friends.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 px-3 py-2"
            >
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-[var(--pc-text-muted)]">{f.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    f.status === "friend"
                      ? "success"
                      : f.status === "pending"
                      ? "warning"
                      : f.status === "blocked"
                      ? "danger"
                      : "info"
                  }
                >
                  {f.status === "friend"
                    ? "В друзьях"
                    : f.status === "pending"
                    ? "Ожидает"
                    : f.status === "blocked"
                    ? "Блок"
                    : "Заявка"}
                </Badge>
                {f.status === "request" && (
                  <IconButton subtle aria-label="Принять" onClick={() => acceptRequest(f.id)}>
                    <Check className="h-4 w-4" />
                  </IconButton>
                )}
                {f.status !== "blocked" && (
                  <IconButton subtle aria-label="Блокировать" onClick={() => block(f.id)}>
                    <UserPlus className="h-4 w-4" />
                  </IconButton>
                )}
                <IconButton subtle aria-label="Удалить" onClick={() => remove(f.id)}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
