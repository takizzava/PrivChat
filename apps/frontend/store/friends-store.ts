"use client";

import { create } from "zustand";
import { persist, restore } from "@lib/storage";

export type FriendStatus = "friend" | "pending" | "request" | "blocked";

export type Friend = {
  id: number;
  name: string;
  phone: string;
  status: FriendStatus;
  added_at: string;
};

type State = {
  friends: Friend[];
  searchResults: Friend[];
  lastId: number;
};

type Actions = {
  searchByPhone: (phone: string) => void;
  sendRequest: (name: string, phone: string) => void;
  acceptRequest: (id: number) => void;
  block: (id: number) => void;
  remove: (id: number) => void;
};

const STORAGE_KEY = "privchat_friends";

const defaultState: State = {
  friends: [
    { id: 1, name: "Алексей Смирнов", phone: "+79991112233", status: "friend", added_at: new Date().toISOString() },
    { id: 2, name: "Мария Иванова", phone: "+79995556677", status: "friend", added_at: new Date().toISOString() },
    { id: 3, name: "Команда дизайна", phone: "+70000000000", status: "friend", added_at: new Date().toISOString() }
  ],
  searchResults: [],
  lastId: 4
};

const restored = restore<State>(STORAGE_KEY, defaultState);

export const useFriendsStore = create<State & Actions>((set, get) => ({
  ...defaultState,
  ...restored,
  searchByPhone(phone) {
    const normalized = phone.replace(/\s|-/g, "");
    const exists = get().friends.find((f) => f.phone === normalized);
    const mock: Friend = exists || {
      id: get().lastId + 1,
      name: "Новый контакт",
      phone: normalized,
      status: "request",
      added_at: new Date().toISOString()
    };
    set((s) => {
      const next = { ...s, searchResults: [mock] };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  sendRequest(name, phone) {
    set((s) => {
      const id = s.lastId + 1;
      const contact: Friend = {
        id,
        name: name || "Контакт",
        phone: phone.replace(/\s|-/g, ""),
        status: "pending",
        added_at: new Date().toISOString()
      };
      const next = {
        ...s,
        lastId: id,
        friends: [contact, ...s.friends],
        searchResults: []
      };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  acceptRequest(id) {
    set((s) => {
      const friends = s.friends.map((f) =>
        f.id === id ? { ...f, status: "friend", added_at: new Date().toISOString() } : f
      );
      const next = { ...s, friends };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  block(id) {
    set((s) => {
      const friends = s.friends.map((f) => (f.id === id ? { ...f, status: "blocked" } : f));
      const next = { ...s, friends };
      persist(STORAGE_KEY, next);
      return next;
    });
  },
  remove(id) {
    set((s) => {
      const friends = s.friends.filter((f) => f.id !== id);
      const next = { ...s, friends };
      persist(STORAGE_KEY, next);
      return next;
    });
  }
}));
