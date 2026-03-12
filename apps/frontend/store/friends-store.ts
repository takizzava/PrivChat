"use client";

import { create } from "zustand";
import api from "@lib/api";
import { persist, restore } from "@lib/storage";

export type ContactStatus = "accepted" | "pending" | "blocked" | "none";

export type Contact = {
  id: number;
  user_id: number;
  contact_id: number;
  status: ContactStatus;
  inserted_at: string;
  user: {
    id: number;
    display_name?: string | null;
    username?: string | null;
    phone?: string | null;
  };
};

type State = {
  contacts: Contact[];
  searchResults: Array<{
    id: number;
    display_name?: string | null;
    username: string;
    phone: string;
    status?: ContactStatus;
  }>;
  loading: boolean;
};

type Actions = {
  loadContacts: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  addContact: (userId: number) => Promise<void>;
  clearSearch: () => void;
};

const STORAGE_KEY = "privchat_contacts";
const defaultState: State = { contacts: [], searchResults: [], loading: false };
const restored = restore<State>(STORAGE_KEY, defaultState);

export const useFriendsStore = create<State & Actions>((set, get) => ({
  ...defaultState,
  ...restored,
  async loadContacts() {
    set({ loading: true });
    try {
      const res = await api.get("/contacts");
      const contacts = res.data.contacts as Contact[];
      set((s) => {
        const next = { ...s, contacts, loading: false };
        persist(STORAGE_KEY, next);
        return next;
      });
    } catch (e) {
      set((s) => ({ ...s, loading: false }));
      throw e;
    }
  },
  async searchUsers(query: string) {
    const q = query.trim();
    if (!q) {
      set((s) => ({ ...s, searchResults: [] }));
      return;
    }
    try {
      const res = await api.get("/users/search", { params: { q } });
      const results = res.data.results as State["searchResults"];
      set((s) => {
        const next = { ...s, searchResults: results };
        persist(STORAGE_KEY, next);
        return next;
      });
    } catch (e) {
      // При ошибке просто очищаем результаты, чтобы не ронять UI
      set((s) => {
        const next = { ...s, searchResults: [] };
        persist(STORAGE_KEY, next);
        return next;
      });
    }
  },
  async addContact(userId: number) {
    const res = await api.post("/contacts", { user_id: userId });
    const contacts = res.data.contacts as Contact[];
    set((s) => {
      const next = { ...s, contacts, searchResults: [] };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  clearSearch() {
    set((s) => ({ ...s, searchResults: [] }));
  }
}));
