"use client";

import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Smartphone, Bell } from "lucide-react";

import AppShell from "@components/layout/app-shell";
import ThemeEditor from "@components/settings/theme-editor";
import { Badge } from "@components/ui/badge";
import { IconButton } from "@components/ui/icon-button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";

import { useAuthStore } from "@store/auth-store";
import { useProfileStore } from "@store/profile-store";
import {
  apiSetup2fa,
  apiConfirm2fa,
  apiDisable2fa,
  apiSaveKeyBackup,
  apiGetKeyBackup
} from "@lib/auth";
import { createBackup, restoreBackup } from "@lib/crypto";

export default function SettingsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const profile = useProfileStore();
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [hydrated, setHydrated] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");
  const [backupPass, setBackupPass] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [backupFingerprint, setBackupFingerprint] = useState("");
  const [tfaError, setTfaError] = useState<string | null>(null);
  const [tfaSuccess, setTfaSuccess] = useState<string | null>(null);
  const [tfaLoading, setTfaLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !authHydrated) return;
    if (!token) router.replace("/login");
  }, [hydrated, authHydrated, token, router]);

  const describeError = (error?: unknown) => {
    if (!error) return "Произошла ошибка";

    const axiosError = error as AxiosError;

    if (axiosError.response) {
      return (
        (axiosError.response.data as any)?.error ||
        axiosError.response.statusText ||
        `Ошибка ${axiosError.response.status}`
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Неизвестная ошибка";
  };

  const setup2fa = async () => {
    if (!token) {
      router.replace("/login");
      return;
    }

    setTfaError(null);
    setTfaSuccess(null);
    setTfaLoading(true);

    try {
      const res = await apiSetup2fa();
      setTwoFASecret(res.secret);
      setRecoveryCodes(res.recovery_codes || []);
      setTfaSuccess("Secret generated - save recovery codes.");
    } catch (error) {
      setTfaError(describeError(error));
    } finally {
      setTfaLoading(false);
    }
  };

  const confirm2fa = async () => {
    const code = otpCode.trim();

    if (!code) {
      setTfaError("Enter the one-time code.");
      return;
    }

    setTfaError(null);
    setTfaSuccess(null);
    setTfaLoading(true);

    try {
      await apiConfirm2fa(code);
      setTfaSuccess("Two-factor authentication enabled.");
      setOtpCode("");
    } catch (error) {
      setTfaError(describeError(error));
    } finally {
      setTfaLoading(false);
    }
  };

  const disable2faHandler = async () => {
    setTfaError(null);
    setTfaSuccess(null);
    setTfaLoading(true);

    try {
      await apiDisable2fa(otpCode.trim() || undefined);
      setTwoFASecret("");
      setRecoveryCodes([]);
      setTfaSuccess("Two-factor authentication disabled.");
    } catch (error) {
      setTfaError(describeError(error));
    } finally {
      setTfaLoading(false);
    }
  };

  const saveBackup = async () => {
    setBackupStatus("");
    setBackupLoading(true);

    try {
      const pass = backupPass || "privchat";
      const bundle = await createBackup(pass);

      await apiSaveKeyBackup({
        blob: bundle.blob,
        version: bundle.version,
        fingerprint: bundle.fingerprint,
        salt: bundle.salt,
        iv: bundle.iv
      });

      setBackupStatus("Backup saved.");
      setBackupFingerprint(bundle.fingerprint);
    } catch (error) {
      setBackupStatus(describeError(error));
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackupFromServer = async () => {
    setBackupStatus("");
    setBackupLoading(true);

    try {
      const backup = await apiGetKeyBackup();

      if (!backup || (!backup.encrypted_blob && !backup.blob)) {
        setBackupStatus("No backup available.");
        return;
      }

      const bundle = {
        blob: backup.encrypted_blob || backup.blob,
        salt: backup.salt,
        iv: backup.iv,
        fingerprint: backup.key_fingerprint || "",
        version: backup.version || "v1"
      };

      await restoreBackup(bundle as any, backupPass || "privchat");
      setBackupStatus("Key restored.");
      setBackupFingerprint(bundle.fingerprint);
    } catch (error) {
      setBackupStatus(describeError(error));
    } finally {
      setBackupLoading(false);
    }
  };

  if (!hydrated || !authHydrated || !token) return null;

  return (
    <AppShell>
      <div className="flex-1 bg-[var(--pc-bg)]">
        <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--pc-text-muted)]">Ваш профиль и внешний вид</p>
              <h1 className="text-3xl font-semibold">Настройки</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-[var(--pc-text-muted)]">
                <ShieldCheck className="h-4 w-4" />
                <span>Ваши данные защищены</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge tone="info" variant="soft">
                {user?.phone || user?.email}
              </Badge>
              <IconButton subtle aria-label="Выйти" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[var(--pc-primary)]" />
                <div>
                  <p className="font-semibold">Уведомления</p>
                  <p className="text-xs text-[var(--pc-text-muted)]">
                    Включите уведомления в браузере, чтобы не пропускать сообщения.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface-strong)]/70 p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[var(--pc-primary)]" />
                <div>
                  <p className="font-semibold">Мобильный режим</p>
                  <p className="text-xs text-[var(--pc-text-muted)]">
                    Приложение оптимизировано под телефоны — используйте снизу навигацию.
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
                    Мы используем токены и валидацию на сервере. Не делитесь паролем.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--pc-text-muted)]">Двухфакторная защита</p>
                  <h3 className="text-lg font-semibold">2FA / OTP</h3>
                </div>

                <Badge tone="info" variant="soft">
                  beta
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={setup2fa} disabled={tfaLoading}>
                  Generate secret
                </Button>
                <Button size="sm" variant="outline" onClick={confirm2fa} disabled={tfaLoading}>
                  Confirm code
                </Button>
                <Button size="sm" variant="ghost" onClick={disable2faHandler} disabled={tfaLoading}>
                  Disable 2FA
                </Button>
              </div>

              {tfaLoading && (
                <p className="text-xs text-[var(--pc-text-muted)]">Processing...</p>
              )}

              {tfaSuccess && <p className="text-xs text-emerald-400">{tfaSuccess}</p>}

              {tfaError && <p className="text-xs text-rose-400">{tfaError}</p>}

              {twoFASecret && (
                <div className="space-y-1 text-xs text-[var(--pc-text-muted)]">
                  <div>
                    Секрет: <code className="text-[var(--pc-text)]">{twoFASecret}</code>
                  </div>

                  {recoveryCodes.length > 0 && (
                    <div>
                      Резервные коды:
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        {recoveryCodes.map((c) => (
                          <span
                            key={c}
                            className="rounded bg-[var(--pc-surface-strong)] px-2 py-1 text-[var(--pc-text)]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Input
                label="Код из приложения"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456 или recovery код"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--pc-text-muted)]">E2EE keys</p>
                  <h3 className="text-lg font-semibold">Backup and restore</h3>
                </div>
              </div>

              <Input
                label="Backup password"
                value={backupPass}
                onChange={(e) => setBackupPass(e.target.value)}
                placeholder="Enter a password to encrypt the backup"
              />

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={saveBackup} disabled={backupLoading}>
                  Save backup
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={restoreBackupFromServer}
                  disabled={backupLoading}
                >
                  Restore backup
                </Button>
              </div>

              {backupStatus && (
                <p className="text-xs text-[var(--pc-text-muted)]">{backupStatus}</p>
              )}

              {backupFingerprint && (
                <p className="text-xs text-[var(--pc-text-muted)]">
                  Key fingerprint: {backupFingerprint}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)]/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--pc-text-muted)]">Профиль</p>
                <h2 className="text-xl font-semibold">Контакты и описание</h2>
              </div>

              <Badge tone="info" variant="soft">
                Сохраняется локально
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <Button onClick={() => updateProfile({})}>Сохранить</Button>
            </div>
          </div>

          <ThemeEditor />
        </div>
      </div>
    </AppShell>
  );
}