"use client";

type TabChipItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function TabChipRail<T extends string>({
  label,
  items,
  value,
  onChange,
  className = "",
}: {
  label: string;
  items: readonly TabChipItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`public-session-scroll -mx-1 overflow-x-auto px-1 pb-1 ${className}`}>
      <div role="group" aria-label={label} className="flex min-w-max gap-2">
        {items.map((item) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              aria-label={item.count === undefined ? item.label : `${item.label}, ${item.count}`}
              onClick={() => onChange(item.value)}
              className={`pressable inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-[650] ${
                selected
                  ? "border-primary/20 bg-primary-soft text-primary"
                  : "border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
