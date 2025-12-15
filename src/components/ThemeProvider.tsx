// src/components/ThemeProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LS_KEY = "kravy:theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // read saved preference on mount
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") {
        setThemeState(raw as Theme);
      } else {
        setThemeState("system");
      }
    } catch (e) {
      setThemeState("system");
    }
  }, []);

  // apply theme whenever theme or system preference changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    const systemPrefersDark = mediaQuery ? mediaQuery.matches : false;

    const computeResolved = (t: Theme) => (t === "system" ? (systemPrefersDark ? "dark" : "light") : t);

    const apply = (resolved: "light" | "dark") => {
      const root = document.documentElement;
      if (resolved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      setResolvedTheme(resolved);
    };

    // initial apply
    apply(computeResolved(theme));

    // listen for system changes if theme === system
    const handler = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        apply(e.matches ? "dark" : "light");
      }
    };
    try {
      mediaQuery?.addEventListener?.("change", handler);
    } catch {
      // Safari fallback
      mediaQuery?.addListener?.(handler as any);
    }

    return () => {
      try {
        mediaQuery?.removeEventListener?.("change", handler);
      } catch {
        mediaQuery?.removeListener?.(handler as any);
      }
    };
  }, [theme, mounted]);

  // helper to set theme and persist
  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem(LS_KEY, t);
    } catch {}
    setThemeState(t);
  };

  const toggleTheme = () => {
    // cycle light -> dark -> system -> light
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      try {
        localStorage.setItem(LS_KEY, next);
      } catch {}
      return next;
    });
  };

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// hook
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

