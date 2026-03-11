"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { useAuthStore } from "@store/auth-store";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Eye, EyeOff, Lock, Mail, Sparkles, UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      router.replace("/chats");
    }
  }, [token, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || email.split("@")[0]);
      }
      router.replace("/chats");
    } catch (err: any) {
      const axiosErr = err as AxiosError<any>;
      const data = axiosErr.response?.data;

      if (data?.errors) {
        if (typeof data.errors === "string") {
          setError(data.errors);
        } else if (data.errors.email?.length) {
          setError("Email указан некорректно");
        } else {
          setError("Проверьте введённые данные и попробуйте снова.");
        }
      } else if (data?.error === "invalid_credentials") {
        setError("Неверный email или пароль");
      } else {
        setError("Что-то пошло не так. Попробуйте ещё раз позже.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1224] to-[#0f172a] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(92,124,250,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_30%)] pointer-events-none" />
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/60 p-8 shadow-2xl shadow-indigo-950/30">
          <div>
            <Badge variant="soft" tone="info">
              Сквозное шифрование
            </Badge>
            <h1 className="mt-6 text-3xl font-semibold">PrivChat</h1>
            <p className="mt-2 text-[var(--pc-text-muted)] text-sm leading-relaxed">
              Современный мессенджер с мгновенной синхронизацией, настройкой темы и
              оптимизацией под десктоп и мобильные устройства.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Поддержка тёмной и светлой темы",
              "Уведомления и статус сессий",
              "Быстрые фильтры диалогов и поиск",
              "Полноценный опыт отправки сообщений"
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[var(--pc-border)] bg-white/5 px-3 py-2"
              >
                <div className="h-9 w-9 rounded-xl bg-[var(--pc-primary)]/15 text-[var(--pc-primary)] flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-sm text-[var(--pc-text)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/70 backdrop-blur shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--pc-text-muted)]">
                Добро пожаловать
              </p>
              <h2 className="text-2xl font-semibold">Войдите в аккаунт</h2>
            </div>
            <Badge tone="info" variant="soft">
              Beta
            </Badge>
          </div>

          <div className="flex rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 p-1 mt-4">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-[var(--pc-primary)] text-white"
                  : "text-[var(--pc-text-muted)]"
              }`}
              onClick={() => setMode("login")}
            >
              Вход
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-[var(--pc-primary)] text-white"
                  : "text-[var(--pc-text-muted)]"
              }`}
              onClick={() => setMode("register")}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
            />

            {mode === "register" && (
              <Input
                label="Отображаемое имя"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                prefix={<UserRound className="h-4 w-4" />}
                placeholder="Имя в профиле"
              />
            )}

            <div>
              <label className="flex items-center justify-between text-sm text-[var(--pc-text)] mb-2">
                <span>Пароль</span>
                <span className="text-xs text-[var(--pc-text-muted)]">Минимум 8 символов</span>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-2 text-sm text-[var(--pc-text)] focus-within:border-[var(--pc-primary)] focus-within:shadow-[0_0_0_1px_var(--pc-primary)]">
                <Lock className="h-4 w-4 text-[var(--pc-text-muted)]" />
                <input
                  className="flex-1 bg-transparent outline-none placeholder:text-[var(--pc-text-muted)]"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                />
                <IconButton
                  type="button"
                  subtle
                  aria-label="Показать пароль"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" block className="h-11 text-base">
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
