"use client";

import {
  AEGIS_THEME_STORAGE_KEY,
  applyAegisThemeToDocument,
  DEFAULT_AEGIS_THEME,
  mergeTheme,
  parseStoredTheme,
  type AegisTheme,
} from "@/lib/aegis-theme";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

type ThemeContextValue = {
  theme: AegisTheme;
  setTheme: (next: AegisTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AegisTheme>(DEFAULT_AEGIS_THEME);

  useLayoutEffect(() => {
    const stored = parseStoredTheme(
      typeof window !== "undefined"
        ? localStorage.getItem(AEGIS_THEME_STORAGE_KEY)
        : null,
    );
    const merged = mergeTheme(stored);
    applyAegisThemeToDocument(merged);
    startTransition(() => {
      setThemeState(merged);
    });
  }, []);

  const setTheme = useCallback((next: AegisTheme) => {
    setThemeState(next);
    applyAegisThemeToDocument(next);
    try {
      localStorage.setItem(AEGIS_THEME_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAegisTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAegisTheme must be used within ThemeProvider");
  }
  return ctx;
}
