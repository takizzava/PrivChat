import { describe, it, expect } from "vitest";
import { useThemeStore } from "@store/theme-store";

describe("theme-store", () => {
  it("changes theme", () => {
    useThemeStore.setState({
      ...useThemeStore.getState(),
      theme: "light"
    });
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });
});

