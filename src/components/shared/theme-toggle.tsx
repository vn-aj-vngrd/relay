"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

const themeColors = { light: "oklch(0.965 0.002 75)", dark: "oklch(0.145 0.006 275)" } as const;
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

export function ThemeToggle({ inverse = false, showLabel = false }: { inverse?: boolean; showLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const next = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? Moon : Sun;

  return <button type="button" onClick={() => applyTheme(next)} aria-label={`Use ${next} mode`} className={`pressable ${showLabel ? "flex h-9 w-full items-center gap-2 px-2" : "grid h-9 w-9 place-items-center"} rounded-md ${inverse ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-surface-strong hover:text-ink"}`}><Icon aria-hidden size={18} weight="regular" />{showLabel ? <span className="text-[13px] font-medium">{theme === "light" ? "Dark mode" : "Light mode"}</span> : null}</button>;
}
