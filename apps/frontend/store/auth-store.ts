"use client";

import { create } from "zustand";
import {
  apiLogin,
  apiRegister,
  setStoredUser,
  setToken,
  getStoredUser
} from "@lib/auth";
import type { User } from "@t/user";

type State = {
  user: User | null;
  token: string | null;
};

type Actions = {
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    phone: string;
    username: string;
    password: string;
    email?: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => void;
};

const initialUser =
  typeof window !== "undefined" ? getStoredUser() : null;
const initialToken =
  typeof window !== "undefined"
    ? window.localStorage.getItem("privchat_token")
    : null;

export const useAuthStore = create<State & Actions>((set) => ({
  user: initialUser,
  token: initialToken,
  async login(identifier, password) {
    const { token, user } = await apiLogin(identifier, password);
    setToken(token);
    setStoredUser(user);
    set({ token, user });
  },
  async register(payload) {
    const { token, user } = await apiRegister(payload);
    setToken(token);
    setStoredUser(user);
    set({ token, user });
  },
  logout() {
    setToken(null);
    setStoredUser(null);
    set({ token: null, user: null });
  }
}));
