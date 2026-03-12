"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { useAuthStore } from "@store/auth-store";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Eye, EyeOff, Lock, Mail, Phone, UserRound, AtSign } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+7");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      router.replace("/chats");
    }
  }, [token, router]);

  const formatError = (err: AxiosError<any>) => {
    const data = err.response?.data;
    if (data?.error === "invalid_credentials") {
      return "Неверный логин или пароль";
    }
    if (typeof data?.error === "string") return data.error;
    if (data?.errors) {
      const firstField = Object.keys(data.errors)[0];
      const fieldMsg = data.errors[firstField]?.[0];
      if (firstField === "phone" && fieldMsg?.includes("has already been taken")) {
        return "Телефон уже используется";
      }
      if (firstField === "username" && fieldMsg?.includes("has already been taken")) {
        return "Ник уже занят";
      }
      return fieldMsg || "Проверьте введённые данные";
    }
    return "Что-то пошло не так. Попробуйте ещё раз.";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(identifier, password);
      } else {
        await register({
          phone,
          username,
          password,
          email: email || undefined,
          display_name: displayName || username
        });
      }
      router.replace("/chats");
    } catch (err: any) {
      const axiosErr = err as AxiosError<any>;
      setError(formatError(axiosErr));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.16),transparent_30%)]" />
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 backdrop-blur-lg p-8 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--pc-text-muted)]">
                Добро пожаловать
              </p>
              <h2 className="text-3xl font-semibold">PrivChat</h2>
              <p className="text-sm text-[var(--pc-text-muted)] mt-1">
                Зашифрованный 1:1 мессенджер с контактами и быстрым поиском.
              </p>
            </div>
            <Badge tone="info" variant="soft">
              beta
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              "Регистрация по телефону и нику",
              "Быстрый поиск по контактам",
              "Адаптивный интерфейс под мобильный"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 px-3 py-3 text-[var(--pc-text)] shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 backdrop-blur-lg p-8 shadow-xl">
          <div className="flex rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/60 p-1">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-[var(--pc-primary)] text-white shadow-sm"
                  : "text-[var(--pc-text-muted)]"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Вход
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-[var(--pc-primary)] text-white shadow-sm"
                  : "text-[var(--pc-text-muted)]"
              }`}
              onClick={() => setMode("register")}
              type="button"
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            {mode === "login" ? (
              <Input
                label="Телефон / ник / email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                prefix={<AtSign className="h-4 w-4" />}
                placeholder="+7 999 123-45-67 или username"
              />
            ) : (
              <>
                <Input
                  label="Телефон"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  prefix={<Phone className="h-4 w-4" />}
                  placeholder="+7 999 123-45-67"
                />
                <Input
                  label="Никнейм (username)"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  prefix={<UserRound className="h-4 w-4" />}
                  placeholder="username"
                />
                <Input
                  label="Отображаемое имя"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  prefix={<UserRound className="h-4 w-4" />}
                  placeholder="Как вас видят контакты"
                />
                <Input
                  label="Email (необязательно)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefix={<Mail className="h-4 w-4" />}
                  placeholder="you@example.com"
                />
              </>
            )}

            <div>
              <label className="flex items-center justify-between text-sm text-[var(--pc-text)] mb-2">
                <span>Пароль</span>
                <span className="text-xs text-[var(--pc-text-muted)]">мин. 8 символов</span>
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
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-100 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" block className="h-11 text-base" disabled={loading}>
              {loading ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
