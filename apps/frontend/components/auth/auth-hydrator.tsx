"use client";

import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { useAuthStore } from "@store/auth-store";

export default function AuthHydrator({ children }: PropsWithChildren<unknown>) {
  useEffect(() => {
    useAuthStore.getState().hydrateAuth();
  }, []);

  return <>{children}</>;
}
