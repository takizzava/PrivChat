import api from "./api";
import type { User } from "@t/user";

const TOKEN_KEY = "privchat_token";
const USER_KEY = "privchat_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function setStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(USER_KEY);
  } else {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export async function apiLogin(email: string, password: string, otp?: string) {
  const res = await api.post("/auth/login", { identifier: email, password, otp });
  return res.data as { token: string; user: User; session_id?: number };
}

export async function apiRegister(payload: {
  phone: string;
  username: string;
  password: string;
  display_name?: string;
  email?: string;
}) {
  const res = await api.post("/auth/register", payload);
  return res.data as { token: string; user: User; session_id?: number };
}

export async function apiSetup2fa() {
  const res = await api.post("/auth/2fa/setup");
  return res.data as { secret: string; recovery_codes: string[] };
}

export async function apiConfirm2fa(code: string) {
  const res = await api.post("/auth/2fa/confirm", { code });
  return res.data as { ok: boolean };
}

export async function apiDisable2fa(code?: string) {
  const res = await api.post("/auth/2fa/disable", { code });
  return res.data as { ok: boolean };
}

export async function apiSessions() {
  const res = await api.get("/auth/sessions");
  return res.data.sessions as Array<{
    id: number;
    device_label?: string;
    user_agent?: string;
    ip?: string;
    expires_at?: string;
    revoked_at?: string;
    inserted_at?: string;
  }>;
}

export async function apiRevokeSession(id: number) {
  const res = await api.post(`/auth/sessions/${id}/revoke`);
  return res.data as { ok: boolean };
}

export async function apiSaveKeyBackup(payload: {
  blob: string;
  version?: string;
  fingerprint?: string;
  salt: string;
  iv: string;
}) {
  const res = await api.put("/auth/key-backup", payload);
  return res.data;
}

export async function apiGetKeyBackup() {
  const res = await api.get("/auth/key-backup");
  return res.data.backup as { encrypted_blob?: string; blob?: string; version?: string; key_fingerprint?: string; salt?: string; iv?: string } | null;
}
