"use client";

import { CalendarBlank, Rows, SquaresFour } from "@phosphor-icons/react";
import { type ComponentType, useSyncExternalStore } from "react";

import { ThemeToggle } from "@/components/shared/theme-toggle";

type Density = "comfortable" | "compact";
type GameView = "list" | "grid" | "calendar";
type WeekStart = "sunday" | "monday";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: ComponentType<{ size?: number }> }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-surface-strong p-1">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`pressable flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium ${value === option.value ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}
          >
            {Icon ? <Icon size={15} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function getPreferences() {
  const density: Density = localStorage.getItem("relay-density") === "compact" ? "compact" : "comfortable";
  const savedView = localStorage.getItem("relay-games-view");
  const gameView: GameView = savedView === "grid" || savedView === "calendar" ? savedView : "list";
  const weekStart: WeekStart = localStorage.getItem("relay-week-start") === "monday" ? "monday" : "sunday";
  return `${density}|${gameView}|${weekStart}`;
}

function subscribe(callback: () => void) {
  window.addEventListener("relay-preferences-change", callback);
  window.addEventListener("relay-games-view-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("relay-preferences-change", callback);
    window.removeEventListener("relay-games-view-change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function PreferenceControls({ appearanceOnly = false }: { appearanceOnly?: boolean }) {
  const [density, gameView, weekStart] = useSyncExternalStore(
    subscribe,
    getPreferences,
    () => "comfortable|list|sunday",
  ).split("|") as [Density, GameView, WeekStart];
  const notify = () => window.dispatchEvent(new Event("relay-preferences-change"));
  const setDensity = (value: Density) => {
    document.documentElement.dataset.density = value;
    localStorage.setItem("relay-density", value);
    notify();
  };
  const setGameView = (value: GameView) => {
    localStorage.setItem("relay-games-view", value);
    window.dispatchEvent(new Event("relay-games-view-change"));
  };
  const setWeekStart = (value: WeekStart) => {
    localStorage.setItem("relay-week-start", value);
    notify();
  };

  return (
    <div className="space-y-9">
      <section aria-labelledby="appearance-title">
        <h2 id="appearance-title" className="text-sm font-semibold">
          Appearance
        </h2>
        <div className="mt-2 divide-y divide-line border-y border-line">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium">Color theme</p>
              <p className="mt-0.5 text-xs text-muted">Switch between light and dark.</p>
            </div>
            <div className="w-36">
              <ThemeToggle showLabel />
            </div>
          </div>
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">Layout density</p>
              <p className="mt-0.5 text-xs text-muted">Tighten repeated rows and supporting sections.</p>
            </div>
            <Segmented
              label="Layout density"
              value={density}
              onChange={setDensity}
              options={[
                { value: "comfortable", label: "Default" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </div>
        </div>
      </section>

      {!appearanceOnly ? (
        <section aria-labelledby="games-title">
          <h2 id="games-title" className="text-sm font-semibold">
            Games
          </h2>
          <div className="mt-2 divide-y divide-line border-y border-line">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">Default games view</p>
                <p className="mt-0.5 text-xs text-muted">Used when you open Games.</p>
              </div>
              <Segmented
                label="Default games view"
                value={gameView}
                onChange={setGameView}
                options={[
                  { value: "list", label: "List", icon: Rows },
                  { value: "grid", label: "Grid", icon: SquaresFour },
                  { value: "calendar", label: "Calendar", icon: CalendarBlank },
                ]}
              />
            </div>
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">Week starts on</p>
                <p className="mt-0.5 text-xs text-muted">Applied to the game calendar.</p>
              </div>
              <Segmented
                label="First day of week"
                value={weekStart}
                onChange={setWeekStart}
                options={[
                  { value: "sunday", label: "Sunday" },
                  { value: "monday", label: "Monday" },
                ]}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
