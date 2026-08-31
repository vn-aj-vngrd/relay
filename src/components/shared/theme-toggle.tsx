"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

const themeColors = { light: "oklch(0.965 0.002 75)", dark: "oklch(0.145 0.006 275)" } as const;
export type Theme = keyof typeof themeColors;
export type ThemePreference = Theme | "system";

function systemTheme(): Theme {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[theme]);
}

export function getThemePreference(): ThemePreference {
  const saved = localStorage.getItem("relay-theme");
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

export function setThemePreference(preference: ThemePreference) {
  applyTheme(preference === "system" ? systemTheme() : preference);
  localStorage.setItem("relay-theme", preference);
  window.dispatchEvent(new Event("relay-theme-change"));
}

function subscribe(callback: () => void) {
  const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const handleSystemChange = () => {
    if (localStorage.getItem("relay-theme") === "system") applyTheme(systemTheme());
    callback();
  };
  const handleStorage = () => {
    const preference = getThemePreference();
    applyTheme(preference === "system" ? systemTheme() : preference);
    callback();
  };
  window.addEventListener("relay-theme-change", callback);
  window.addEventListener("storage", handleStorage);
  media?.addEventListener("change", handleSystemChange);
  return () => {
    window.removeEventListener("relay-theme-change", callback);
    window.removeEventListener("storage", handleStorage);
    media?.removeEventListener("change", handleSystemChange);
  };
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Desktop },
] satisfies { value: ThemePreference; label: string; icon: typeof Sun }[];

export function ThemeSelector() {
  const preference = useSyncExternalStore(subscribe, getThemePreference, (): ThemePreference => "system");

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex rounded-lg border border-line bg-surface-strong p-0.5"
    >
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setThemePreference(value)}
            className={`pressable flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium ${
              selected ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"
            }`}
          >
            <Icon aria-hidden size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggle({ inverse = false, showLabel = false }: { inverse?: boolean; showLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const next = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => setThemePreference(next)}
      aria-label={`Use ${next} mode`}
      className={`pressable ${showLabel ? "flex h-9 w-full items-center gap-2 px-2" : "grid h-9 w-9 place-items-center"} rounded-md ${inverse ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-surface-strong hover:text-ink"}`}
    >
      <Icon aria-hidden size={18} weight="regular" />
      {showLabel ? (
        <span className="text-[13px] font-medium">{theme === "light" ? "Dark mode" : "Light mode"}</span>
      ) : null}
    </button>
  );
}
