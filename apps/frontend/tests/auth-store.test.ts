import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@store/auth-store";

vi.mock("@lib/auth", () => ({
  apiLogin: vi.fn(async () => ({
    token: "t",
    user: { id: 1, email: "a@b.c", inserted_at: new Date().toISOString() }
  })),
  apiRegister: vi.fn(async () => ({
    token: "t",
    user: { id: 1, email: "a@b.c", inserted_at: new Date().toISOString() }
  })),
  setStoredUser: () => {},
  setToken: () => {},
  getStoredUser: () => null
}));

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null } as any);
  });

  it("logs in", async () => {
    await useAuthStore.getState().login("a@b.c", "x");
    const s = useAuthStore.getState();
    expect(s.token).toBe("t");
    expect(s.user?.email).toBe("a@b.c");
  });
});

