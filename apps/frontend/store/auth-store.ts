"use client";

import { create } from "zustand";
import {
  apiLogin,
  apiRegister,
  setStoredUser,
  setToken,
  getStoredUser
} from "@lib/auth";
import { User } from "@types/user";

type State = {
  user: User | null;
  token: string | null;
};

type Actions = {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
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
  async login(email, password) {
    const { token, user } = await apiLogin(email, password);
    setToken(token);
    setStoredUser(user);
    set({ token, user });
  },
  async register(email, password, displayName) {
    const { token, user } = await apiRegister(email, password, displayName);
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

