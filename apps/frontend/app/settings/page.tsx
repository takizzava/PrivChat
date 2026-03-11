"use client";

import ThemeEditor from "@components/settings/theme-editor";
import { useAuthStore } from "@store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@components/layout/app-shell";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { LogOut, ShieldCheck, Smartphone, Bell } from "lucide-react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import { useProfileStore } from "@store/profile-store";

export default function SettingsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) return null;

  return (
    <AppShell>
      <div className="flex-1 bg-[var(--pc-bg)]">
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--pc-text-muted)]">Ваш профиль</p>
              <h1 className="text-3xl font-semibold">Настройки</h1>
              <div className="flex items-center gap-2 text-xs text-[var(--pc-text-muted)] mt-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Сессия защищена</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="info" variant="soft">
                {user?.email}
              </Badge>
              <IconButton subtle aria-label="Выйти" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[var(--pc-primary)]" />
                <div>
                  <p className="font-semibold">Уведомления</p>
                  <p className="text-xs text-[var(--pc-text-muted)]">
                    Включите системные уведомления в браузере.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[var(--pc-primary)]" />
                <div>
                  <p className="font-semibold">Сессии</p>
                  <p className="text-xs text-[var(--pc-text-muted)]">
                    Следите за активностью аккаунта на разных устройствах.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--pc-primary)]" />
                <div>
                  <p className="font-semibold">Безопасность</p>
                  <p className="text-xs text-[var(--pc-text-muted)]">
                    Используйте сложный пароль и не передавайте токен.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--pc-text-muted)]">Профиль</p>
                <h2 className="text-xl font-semibold">Редактирование данных</h2>
              </div>
              <Badge tone="info" variant="soft">
                Локально и на клиенте
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Отображаемое имя"
                value={profile.displayName}
                onChange={(e) => updateProfile({ displayName: e.target.value })}
              />
              <Input
                label="Телефон"
                value={profile.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })}
              />
            </div>
            <Textarea
              label="О себе"
              value={profile.about}
              onChange={(e) => updateProfile({ about: e.target.value })}
            />
            <div className="flex items-center justify-end">
              <Button onClick={() => updateProfile({})}>Сохранено локально</Button>
            </div>
          </div>

          <ThemeEditor />
        </div>
      </div>
    </AppShell>
  );
}
