export function safeLocalStorage() {
  if (typeof window === "undefined") return null;
  try {
    const ls = window.localStorage;
    ls.setItem("__pc_test", "1");
    ls.removeItem("__pc_test");
    return ls;
  } catch {
    return null;
  }
}

export function persist<T>(key: string, value: T) {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.setItem(key, JSON.stringify(value));
}

export function restore<T>(key: string, fallback: T): T {
  const ls = safeLocalStorage();
  if (!ls) return fallback;
  const raw = ls.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

