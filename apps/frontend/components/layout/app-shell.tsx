"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@store/auth-store";
import {
  LogOut,
  MessageSquare,
  Settings2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Avatar } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { useEffect, useState } from "react";
import { NotificationCenter } from "@components/notifications/notification-center";

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { href: "/chats", label: "Диалоги", icon: MessageSquare },
  { href: "/settings", label: "Настройки", icon: Settings2 }
];

export default function AppShell({ children }: Props) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handle = () => setOnline(navigator.onLine);
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-[var(--pc-bg)] text-[var(--pc-text)]">
      <aside className="hidden lg:flex w-72 flex-col border-r border-[var(--pc-border)] bg-[var(--pc-surface-subtle)]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--pc-border)]">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-sm font-bold shadow-md shadow-black/20">
            PC
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight">PrivChat</span>
              <Badge>Beta</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--pc-text-muted)] mt-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Сквозное шифрование</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <IconButton
              aria-label="Выйти"
              onClick={logout}
              subtle
              className="hover:text-rose-200"
            >
              <LogOut className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-all border ${
                  active
                    ? "bg-[var(--pc-primary)]/10 border-[var(--pc-primary)] text-[var(--pc-text)] shadow-sm"
                    : "border-transparent hover:border-[var(--pc-border)] hover:bg-white/5 text-[var(--pc-text-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-xs text-[var(--pc-text-muted)] group-hover:text-[var(--pc-text)]">
                    {item.href === "/chats"
                      ? "Ленты, закрепленные, архив"
                      : "Тема, сессии, уведомления"}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--pc-border)] px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.display_name || user?.email || "Пользователь"} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {user?.display_name || user?.email || "Без имени"}
              </div>
              <div className="text-xs text-[var(--pc-text-muted)] truncate">
                {user?.email ?? "email не указан"}
              </div>
            </div>
            <Badge tone={online ? "success" : "danger"} variant="soft">
              {online ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="mt-3 text-xs text-[var(--pc-text-muted)]">
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span>Командная палитра: Ctrl/Cmd + K</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 border-b border-[var(--pc-border)] bg-[var(--pc-surface)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-xs font-bold shadow-md shadow-black/20">
              PC
            </div>
            <div>
              <div className="font-semibold text-base leading-tight">PrivChat</div>
              <div className="text-[11px] text-[var(--pc-text-muted)] leading-tight">
                {online ? "Подключено" : "Нет сети"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <IconButton subtle aria-label="Настройки" onClick={() => location.assign("/settings")}>
              <Settings2 className="h-5 w-5" />
            </IconButton>
            <IconButton
              subtle
              aria-label="Выйти"
              className="text-rose-200"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:ml-0">
        <main className="flex-1 flex overflow-hidden lg:pl-0 pt-[64px] lg:pt-0">
          {children}
        </main>
      </div>

      {/* Мобильное нижнее меню */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--pc-border)] bg-[var(--pc-surface)]/90 backdrop-blur">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-xs ${
                  active ? "text-[var(--pc-primary)]" : "text-[var(--pc-text-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-xs text-rose-200"
            aria-label="Выйти"
          >
            <LogOut className="h-5 w-5" />
            <span>Выход</span>
          </button>
        </div>
      </div>
    </div>
  );
}
