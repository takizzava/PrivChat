"use client";

import { create } from "zustand";
import { persist, restore } from "@lib/storage";

type Profile = {
  displayName: string;
  phone: string;
  about: string;
  avatarUrl?: string;
};

type Actions = {
  updateProfile: (data: Partial<Profile>) => void;
};

const STORAGE_KEY = "privchat_profile";

const defaultProfile: Profile = {
  displayName: "Новый пользователь",
  phone: "+79990000000",
  about: "Расскажите о себе",
  avatarUrl: undefined
};

const restored = restore<Profile>(STORAGE_KEY, defaultProfile);

export const useProfileStore = create<Profile & Actions>((set) => ({
  ...defaultProfile,
  ...restored,
  updateProfile(data) {
    set((s) => {
      const next = { ...s, ...data };
      persist(STORAGE_KEY, next);
      return next;
    });
  }
}));
