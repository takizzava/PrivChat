"use client";

import { create } from "zustand";
import {
  apiLogin,
  apiRegister,
  setStoredUser,
  setToken,
  getStoredUser,
  getToken
} from "@lib/auth";
import type { User } from "@t/user";

type State = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
};

type Actions = {
  login: (identifier: string, password: string, otp?: string) => Promise<void>;
  register: (payload: {
    phone: string;
    username: string;
    password: string;
    email?: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => void;
  hydrateAuth: () => void;
};

export const useAuthStore = create<State & Actions>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  async login(identifier, password, otp) {
    const { token, user } = await apiLogin(identifier, password, otp);
    setToken(token);
    setStoredUser(user);
    set({ token, user, hydrated: true });
  },
  async register(payload) {
    const { token, user } = await apiRegister(payload);
    setToken(token);
    setStoredUser(user);
    set({ token, user, hydrated: true });
  },
  logout() {
    setToken(null);
    setStoredUser(null);
    set({ token: null, user: null, hydrated: true });
  },
  hydrateAuth() {
    set((state) => {
      if (state.hydrated) {
        return state;
      }
      const storedUser = getStoredUser();
      const storedToken = getToken();
      setToken(storedToken);
      return { user: storedUser, token: storedToken, hydrated: true };
    });
  }
}));
