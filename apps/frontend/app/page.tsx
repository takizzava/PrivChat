"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@store/auth-store";

export default function IndexPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const authHydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!authHydrated) return;
    if (token) {
      router.replace("/chats");
    } else {
      router.replace("/login");
    }
  }, [authHydrated, token, router]);

  return null;
}
