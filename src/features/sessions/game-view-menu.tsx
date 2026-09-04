"use client";

import { CalendarBlank, GridFour, List } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

import { MobileViewMenu } from "@/components/ui/mobile-view-menu";

export type GameViewMode = "list" | "grid" | "calendar";

const preferenceKey = "relay-games-view";

const viewOptions = [
  { value: "list" as const, label: "List", icon: List },
  { value: "grid" as const, label: "Grid", icon: GridFour },
  { value: "calendar" as const, label: "Calendar", icon: CalendarBlank },
];

function getView(): GameViewMode {
  const saved = localStorage.getItem(preferenceKey);
  return saved === "grid" || saved === "calendar" ? saved : "list";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === preferenceKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("relay-games-view-change", callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("relay-games-view-change", callback);
  };
}

function saveView(mode: GameViewMode) {
  localStorage.setItem(preferenceKey, mode);
  window.dispatchEvent(new Event("relay-games-view-change"));
}

export function useGameViewMode() {
  return useSyncExternalStore(subscribe, getView, (): GameViewMode => "list");
}

export function GameViewMenu() {
  const mode = useGameViewMode();
  return (
    <MobileViewMenu
      label="Game view"
      value={mode}
      options={viewOptions}
      onChange={saveView}
    />
  );
}

export function GameDesktopViewControls() {
  const mode = useGameViewMode();

  return (
    <div
      role="group"
      aria-label="Game view"
      className="inline-flex shrink-0 rounded-lg bg-surface-strong p-0.5"
    >
      {viewOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} view`}
          aria-pressed={mode === value}
          onClick={() => saveView(value)}
          className={`pressable grid h-8 w-8 place-items-center rounded-md ${mode === value ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}
        >
          <Icon aria-hidden size={value === "grid" ? 17 : 18} />
        </button>
      ))}
    </div>
  );
}
