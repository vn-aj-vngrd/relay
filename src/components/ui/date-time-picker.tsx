"use client";

import {
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  Clock,
} from "@phosphor-icons/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { useButtonListbox } from "./use-button-listbox";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
});

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

function dateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function shiftCalendarDate(value: Date, months: number, years = 0) {
  const target = new Date(
    value.getFullYear() + years,
    value.getMonth() + months,
    1
  );
  target.setDate(
    Math.min(
      value.getDate(),
      new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    )
  );
  return target;
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute)
    ? timeFormatter.format(new Date(2026, 0, 1, hour, minute))
    : "Choose a time";
}

function useDismiss(
  open: boolean,
  close: () => void,
  root: React.RefObject<HTMLDivElement | null>,
  escape = close
) {
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") escape();
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [close, escape, open, root]);
}

const triggerBaseClass =
  "flex w-full items-center gap-2 rounded-lg border bg-surface px-3 text-left text-ink focus:outline-none";
const compactDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
});

export function DatePickerField({
  id,
  name = id,
  label,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  minValue,
  todayValue,
  error,
  describedBy,
  hideLabel = false,
  density = "default",
  className = "",
  placeholder = "Choose a date",
}: {
  id: string;
  name?: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  minValue?: string;
  todayValue?: string;
  error?: string;
  describedBy?: string;
  hideLabel?: boolean;
  density?: "default" | "compact";
  className?: string;
  placeholder?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const root = useRef<HTMLDivElement>(null);
  const value = controlledValue ?? internalValue;
  const selectValue = (nextValue: string) => {
    if (controlledValue === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    root.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dateButtons = useRef(new Map<string, HTMLButtonElement>());
  const [view, setView] = useState(() => parseDate(defaultValue) ?? new Date());
  const [focusedDate, setFocusedDate] = useState("");
  const selected = parseDate(value);
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: first.getDay() + days }, (_, index) =>
    index < first.getDay()
      ? null
      : new Date(
          view.getFullYear(),
          view.getMonth(),
          index - first.getDay() + 1
        )
  );
  const today = todayValue ?? dateValue(new Date());

  const closeCalendar = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus)
      window.requestAnimationFrame(() => trigger.current?.focus());
  };
  useDismiss(
    open,
    () => closeCalendar(),
    root,
    () => closeCalendar(true)
  );

  useEffect(() => {
    if (!open || !focusedDate) return;
    window.requestAnimationFrame(() =>
      dateButtons.current.get(focusedDate)?.focus()
    );
  }, [focusedDate, open, view]);

  const focusDay = (next: Date) => {
    const nextValue = dateValue(next);
    const allowedValue =
      minValue && nextValue < minValue ? minValue : nextValue;
    const allowedDate = parseDate(allowedValue);
    if (!allowedDate) return;
    setView(new Date(allowedDate.getFullYear(), allowedDate.getMonth(), 1));
    setFocusedDate(allowedValue);
  };

  const openCalendar = () => {
    const preferred =
      selected ?? parseDate(minValue && today < minValue ? minValue : today);
    if (preferred) focusDay(preferred);
    setOpen(true);
  };

  const selectDate = (nextValue: string) => {
    selectValue(nextValue);
    closeCalendar(true);
  };

  const handleDayKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    day: Date
  ) => {
    let next: Date | null = null;
    if (event.key === "ArrowLeft")
      next = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1);
    else if (event.key === "ArrowRight")
      next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    else if (event.key === "ArrowUp")
      next = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 7);
    else if (event.key === "ArrowDown")
      next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7);
    else if (event.key === "Home")
      next = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate() - day.getDay()
      );
    else if (event.key === "End")
      next = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate() + (6 - day.getDay())
      );
    else if (event.key === "PageUp")
      next = shiftCalendarDate(
        day,
        event.shiftKey ? 0 : -1,
        event.shiftKey ? -1 : 0
      );
    else if (event.key === "PageDown")
      next = shiftCalendarDate(
        day,
        event.shiftKey ? 0 : 1,
        event.shiftKey ? 1 : 0
      );
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectDate(dateValue(day));
      return;
    }
    if (!next) return;
    event.preventDefault();
    focusDay(next);
  };

  return (
    <div ref={root} className="relative min-w-0">
      <label
        className={hideLabel ? "sr-only" : "block text-sm font-[650]"}
        htmlFor={id}
      >
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => {
          if (open) closeCalendar();
          else openCalendar();
        }}
        className={`${triggerBaseClass} ${hideLabel ? "mt-0" : "mt-1.5"} ${density === "compact" ? "compact-control h-9 min-h-9 text-[13px]" : "h-11 text-[15px]"} ${error ? "border-danger ring-2 ring-danger/10" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"} ${className}`}
      >
        <CalendarBlank aria-hidden size={17} className="shrink-0 text-muted" />
        <span className={`flex-1 ${selected ? "" : "text-muted"}`}>
          {selected
            ? density === "compact"
              ? compactDateFormatter.format(selected)
              : dateFormatter.format(selected)
            : placeholder}
        </span>
        <CaretDown aria-hidden size={14} className="text-muted" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-auto rounded-xl border border-line bg-surface p-3 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:w-80"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                focusDay(new Date(view.getFullYear(), view.getMonth() - 1, 1))
              }
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
            >
              <CaretLeft aria-hidden size={16} />
            </button>
            <p className="text-sm font-[650]">{monthFormatter.format(view)}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                focusDay(new Date(view.getFullYear(), view.getMonth() + 1, 1))
              }
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
            >
              <CaretRight aria-hidden size={16} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
            {weekdays.map((day) => (
              <span key={day} className="py-1.5">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, index) =>
              day ? (
                <button
                  ref={(node) => {
                    if (node) dateButtons.current.set(dateValue(day), node);
                    else dateButtons.current.delete(dateValue(day));
                  }}
                  key={dateValue(day)}
                  type="button"
                  tabIndex={dateValue(day) === focusedDate ? 0 : -1}
                  aria-label={fullDateFormatter.format(day)}
                  aria-pressed={dateValue(day) === value}
                  disabled={Boolean(minValue && dateValue(day) < minValue)}
                  onKeyDown={(event) => handleDayKeyDown(event, day)}
                  onClick={() => selectDate(dateValue(day))}
                  className={`pressable relative grid h-9 place-items-center rounded-md text-sm disabled:cursor-not-allowed disabled:text-muted/45 ${dateValue(day) === value ? "bg-primary font-semibold text-white" : "hover:bg-surface-strong disabled:hover:bg-transparent"}`}
                >
                  {day.getDate()}
                  {dateValue(day) === today && dateValue(day) !== value ? (
                    <span
                      aria-hidden
                      className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                    />
                  ) : null}
                </button>
              ) : (
                <span key={`blank-${index}`} />
              )
            )}
          </div>
          <div className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                const todayDate = parseDate(today) ?? new Date();
                setView(todayDate);
                selectDate(today);
              }}
              disabled={Boolean(minValue && today < minValue)}
              className="pressable min-h-9 rounded-md px-2.5 text-xs font-semibold text-primary hover:bg-primary-soft"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const timeOptions = Array.from(
  { length: 96 },
  (_, index) =>
    `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`
);

export function TimePickerField({
  id,
  name = id,
  label,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  minValue,
  afterValue,
  beforeValue,
  error,
  describedBy,
  hideLabel = false,
  density = "default",
  className = "",
  placeholder = "Choose a time",
}: {
  id: string;
  name?: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  minValue?: string;
  afterValue?: string;
  beforeValue?: string;
  error?: string;
  describedBy?: string;
  hideLabel?: boolean;
  density?: "default" | "compact";
  className?: string;
  placeholder?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const root = useRef<HTMLDivElement>(null);
  const value = controlledValue ?? internalValue;
  const selectValue = (nextValue: string) => {
    if (controlledValue === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    root.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const options = timeOptions.filter(
    (option) =>
      (!minValue || option >= minValue) &&
      (!afterValue || option > afterValue) &&
      (!beforeValue || option < beforeValue)
  );
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const listboxOptions = options.map((option) => ({
    value: option,
    label: timeLabel(option),
  }));
  const listbox = useButtonListbox({
    options: listboxOptions,
    value,
    open,
    setOpen,
    onSelect: selectValue,
    triggerRef: trigger,
  });
  useDismiss(open, () => listbox.close(), root);
  return (
    <div ref={root} className="relative min-w-0">
      <label
        className={hideLabel ? "sr-only" : "block text-sm font-[650]"}
        htmlFor={id}
      >
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listbox.listboxId}
        aria-activedescendant={
          open && listbox.activeIndex >= 0
            ? listbox.optionId(listbox.activeIndex)
            : undefined
        }
        aria-describedby={describedBy}
        onClick={() => {
          if (open) listbox.close();
          else listbox.show();
        }}
        onKeyDown={listbox.handleKeyDown}
        className={`${triggerBaseClass} score ${hideLabel ? "mt-0" : "mt-1.5"} ${density === "compact" ? "compact-control h-9 min-h-9 text-[13px]" : "h-11 text-[15px]"} ${error ? "border-danger ring-2 ring-danger/10" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"} ${className}`}
      >
        <Clock aria-hidden size={17} className="shrink-0 text-muted" />
        <span className={`flex-1 ${value ? "" : "font-sans text-muted"}`}>
          {value ? timeLabel(value) : placeholder}
        </span>
        <CaretDown aria-hidden size={14} className="text-muted" />
      </button>
      {open ? (
        <div
          id={listbox.listboxId}
          role="listbox"
          aria-label={`${label} options`}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 max-h-[55svh] w-auto overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:max-h-64 sm:w-full sm:min-w-44"
        >
          {options.length ? (
            options.map((option, index) => (
              <button
                id={listbox.optionId(index)}
                key={option}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={value === option}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => listbox.setActiveIndex(index)}
                onClick={() => listbox.choose(index)}
                className={`pressable flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-sm ${listbox.activeIndex === index ? "bg-surface-strong" : value === option ? "bg-primary-soft font-semibold text-primary" : "hover:bg-surface-strong"}`}
              >
                <span className="score">{timeLabel(option)}</span>
                {value === option ? <Check aria-hidden size={14} /> : null}
              </button>
            ))
          ) : (
            <p role="status" className="px-3 py-4 text-sm leading-5 text-muted">
              No times are available. Choose another date or adjust the other
              time.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
