"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const themeColors = {
  light: "oklch(1 0 0)",
  dark: "oklch(0.13 0.014 252)",
} as const;

type Theme = keyof typeof themeColors;

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[theme]);
  localStorage.setItem("relay-theme", theme);
  window.dispatchEvent(new Event("relay-theme-change"));
}

function subscribe(callback: () => void) {
  window.addEventListener("relay-theme-change", callback);
  return () => window.removeEventListener("relay-theme-change", callback);
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({ inverse = false, showLabel = false, className = "" }: { inverse?: boolean; showLabel?: boolean; className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const next = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Use ${next} mode`}
      className={`pressable ${showLabel ? "flex h-14 w-full items-center gap-3 px-3" : "grid h-11 w-11 place-items-center"} rounded-xl border ${inverse ? "border-white/15 text-white hover:bg-white/10" : "border-transparent text-ink hover:bg-primary-soft hover:text-primary"} ${className}`}
    >
      <span className={showLabel ? "grid h-8 w-8 place-items-center rounded-[9px] bg-surface text-primary" : "contents"}><Icon aria-hidden size={19} strokeWidth={2.4} /></span>
      {showLabel ? <span className="text-sm font-[680]">{theme === "light" ? "Dark mode" : "Light mode"}</span> : null}
    </button>
  );
}
