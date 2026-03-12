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

export async function apiLogin(email: string, password: string) {
  const res = await api.post("/auth/login", { identifier: email, password });
  return res.data as { token: string; user: User };
}

export async function apiRegister(payload: {
  phone: string;
  username: string;
  password: string;
  display_name?: string;
  email?: string;
}) {
  const res = await api.post("/auth/register", payload);
  return res.data as { token: string; user: User };
}
