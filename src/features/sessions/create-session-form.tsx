"use client";

import { CaretDown, MapPin, Minus, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { DatePickerField, TimePickerField } from "@/components/ui/date-time-picker";
import { VenueCombobox } from "@/features/venues/venue-combobox";

import { createSessionAction, type SessionActionState } from "./actions";
import { SessionAccentPicker } from "./session-accent-picker";

const labelClass = "block text-sm font-[650]";

function fieldClass(error?: string) {
  return `mt-1.5 h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:outline-none ${error ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"}`;
}

function SessionFormActions() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-5 text-muted">
        Publishing creates the link to share. You can change the plan later.
      </p>
      <Button type="submit" name="intent" value="publish" className="w-full sm:w-auto sm:min-w-40" disabled={pending}>
        {pending ? (
          <>
            <ButtonSpinner />
            Publishing…
          </>
        ) : (
          "Publish game"
        )}
      </Button>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

function errorFor(state: SessionActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

export function QuantityInput({
  id,
  label,
  hint,
  min,
  max,
  initialValue,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  initialValue?: number;
  error?: string;
}) {
  const [value, setValue] = useState(initialValue == null ? "" : String(initialValue));
  const numericValue = value === "" ? Number.NaN : Number(value);
  const describedBy = `${id}-hint${error ? ` ${id}-error` : ""}`;
  const changeBy = (amount: number) => {
    if (!Number.isFinite(numericValue)) {
      setValue(String(min));
      return;
    }
    setValue(String(Math.max(min, Math.min(max, numericValue + amount))));
  };

  return (
    <div className="min-w-0">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div
        className={`mt-1.5 flex h-11 w-full items-stretch overflow-hidden rounded-lg border bg-surface ${error ? "border-danger ring-2 ring-danger/10" : "border-line focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"}`}
      >
        <button
          type="button"
          onClick={() => changeBy(-1)}
          disabled={!Number.isFinite(numericValue) || numericValue <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="pressable grid w-12 shrink-0 place-items-center border-r border-line text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-35"
        >
          <Minus aria-hidden size={17} />
        </button>
        <input
          id={id}
          name={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="score min-w-0 flex-1 appearance-none bg-transparent px-2 text-center text-base font-semibold text-ink outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => changeBy(1)}
          disabled={numericValue >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="pressable grid w-12 shrink-0 place-items-center border-l border-line text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-35"
        >
          <Plus aria-hidden size={17} />
        </button>
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
        {hint}
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export type CreateSessionDefaults = {
  date?: string;
  title?: string;
  venue?: string;
  venueAddress?: string;
  capacity?: number;
  courts?: number;
  start?: string;
  end?: string;
  cost?: number;
  accentColor?: string;
  groupId?: string;
  groupName?: string;
  sourceSessionId?: string;
  inviteeCount?: number;
};

export function CreateSessionForm({ defaults }: { defaults: CreateSessionDefaults }) {
  const [more, setMore] = useState(false);
  const [state, action] = useActionState(createSessionAction, {});

  useEffect(() => {
    const firstInvalid = Object.entries(state.fieldErrors ?? {}).find(([, messages]) => messages.length)?.[0];
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
  }, [state.fieldErrors]);

  const titleError = errorFor(state, "title");
  const venueError = errorFor(state, "venue");
  const dateError = errorFor(state, "date");
  const startError = errorFor(state, "start");
  const endError = errorFor(state, "end");
  const capacityError = errorFor(state, "capacity");
  const courtsError = errorFor(state, "courts");
  const costError = errorFor(state, "cost");
  const notesError = errorFor(state, "notes");
  const value = (field: string, initial?: string | number) =>
    state.values ? (state.values[field] ?? "") : initial == null ? "" : String(initial);
  const advancedOpen =
    more ||
    Boolean(
      costError ||
      notesError ||
      state.values?.cost ||
      state.values?.courtNumbers ||
      state.values?.notes ||
      state.values?.booked ||
      state.values?.requiresApproval ||
      defaults.cost != null ||
      (defaults.accentColor && defaults.accentColor !== "violet"),
    );

  return (
    <form className="space-y-8" action={action} autoComplete="off" noValidate>
      {defaults.groupId ? <input type="hidden" name="groupId" value={defaults.groupId} /> : null}
      {defaults.sourceSessionId ? (
        <input type="hidden" name="sourceSessionId" value={defaults.sourceSessionId} />
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-danger/15"
        >
          {state.error}
        </p>
      ) : null}

      {defaults.groupName ? (
        <section className="border-y border-line py-4">
          <p className="text-sm font-semibold">For {defaults.groupName}</p>
          <p className="mt-1 text-sm text-muted">
            {defaults.inviteeCount
              ? `${defaults.inviteeCount} group ${defaults.inviteeCount === 1 ? "member" : "members"} will be invited when you publish.`
              : "No other members yet. Add players from the group page or share the game link."}
          </p>
        </section>
      ) : defaults.sourceSessionId && defaults.inviteeCount ? (
        <section className="border-y border-line py-4">
          <p className="text-sm font-semibold">Familiar crew ready</p>
          <p className="mt-1 text-sm text-muted">
            {defaults.inviteeCount} signed-in players from the last game will be invited again. Their previous RSVP is
            not copied.
          </p>
        </section>
      ) : null}

      <section className="space-y-6" aria-labelledby="game-basics-heading">
        <div>
          <h2 id="game-basics-heading" className="text-lg font-[680]">
            The plan
          </h2>
          <p className="mt-1 text-sm text-muted">
            Give friends enough context to recognize the game and find the court.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="title">
            Game name
          </label>
          <input
            className={fieldClass(titleError)}
            id="title"
            name="title"
            required
            minLength={2}
            maxLength={80}
            placeholder="Saturday night pickle"
            defaultValue={value("title", defaults.title)}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? "title-error" : "title-hint"}
          />
          <p id="title-hint" className="mt-1.5 text-sm text-muted">
            Use a name your group will recognize.
          </p>
          <FieldError id="title-error" message={titleError} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className={labelClass} htmlFor="venue">
              Venue
            </label>
            <Link
              href="/venues"
              className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[13px] font-semibold text-primary hover:bg-primary-soft"
            >
              <MapPin aria-hidden size={15} /> Find a court
            </Link>
          </div>
          <VenueCombobox
            key={`${value("venue", defaults.venue)}:${value("venueAddress", defaults.venueAddress)}`}
            defaultValue={value("venue", defaults.venue)}
            defaultAddress={value("venueAddress", defaults.venueAddress)}
            error={venueError}
          />
          <FieldError id="venue-error" message={venueError} />
        </div>
      </section>

      <section className="space-y-6 border-t border-line pt-8" aria-labelledby="schedule-heading">
        <div>
          <h2 id="schedule-heading" className="text-lg font-[680]">
            When
          </h2>
          <p className="mt-1 text-sm text-muted">Set the schedule shown on the invite.</p>
        </div>
        <div className="min-w-0">
          <DatePickerField
            key={value("date", defaults.date)}
            id="date"
            label="Date"
            defaultValue={value("date", defaults.date)}
            error={dateError}
            describedBy={dateError ? "date-error" : undefined}
          />
          <FieldError id="date-error" message={dateError} />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <div className="min-w-0">
            <TimePickerField
              key={value("start", defaults.start)}
              id="start"
              label="Start time"
              defaultValue={value("start", defaults.start)}
              error={startError}
              describedBy={startError ? "start-error" : undefined}
            />
            <FieldError id="start-error" message={startError} />
          </div>
          <div className="min-w-0">
            <TimePickerField
              key={value("end", defaults.end)}
              id="end"
              label="End time"
              defaultValue={value("end", defaults.end)}
              error={endError}
              describedBy={endError ? "end-error" : undefined}
            />
            <FieldError id="end-error" message={endError} />
          </div>
        </div>
      </section>

      <section className="space-y-6 border-t border-line pt-8" aria-labelledby="setup-heading">
        <div>
          <h2 id="setup-heading" className="text-lg font-[680]">
            Game setup
          </h2>
          <p className="mt-1 text-sm text-muted">Relay uses these numbers for waitlisting and court organization.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <QuantityInput
            id="capacity"
            label="Player limit"
            hint="2–40 players. Extra players join the waitlist."
            min={2}
            max={40}
            initialValue={
              value("capacity", defaults.capacity) ? Number(value("capacity", defaults.capacity)) : undefined
            }
            error={capacityError}
          />
          <QuantityInput
            id="courts"
            label="Court quantity"
            hint="1–20 courts. You can label them later."
            min={1}
            max={20}
            initialValue={value("courts", defaults.courts) ? Number(value("courts", defaults.courts)) : undefined}
            error={courtsError}
          />
        </div>
      </section>

      <section className="border-t border-line py-2">
        <button
          type="button"
          onClick={() => setMore((open) => !open)}
          aria-expanded={advancedOpen}
          className="pressable flex min-h-14 w-full items-center justify-between text-left font-semibold"
        >
          <span>
            <span className="block">More details</span>
            <span className="mt-0.5 block text-sm font-normal text-muted">
              Approval, cost, court labels, and booking
            </span>
          </span>
          <CaretDown className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`} size={16} />
        </button>
        {advancedOpen ? (
          <div className="space-y-6 pb-5 pt-4">
            <SessionAccentPicker defaultValue={value("accentColor", defaults.accentColor ?? "violet")} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0">
                <label className={labelClass} htmlFor="cost">
                  Estimated cost per player
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-[14px] text-muted">₱</span>
                  <input
                    className={`${fieldClass(costError)} score pl-8`}
                    id="cost"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="300"
                    defaultValue={value("cost", defaults.cost == null ? "" : String(defaults.cost))}
                    aria-invalid={Boolean(costError)}
                    aria-describedby={costError ? "cost-error" : undefined}
                  />
                </div>
                <FieldError id="cost-error" message={costError} />
              </div>
              <div className="min-w-0">
                <label className={labelClass} htmlFor="court-numbers">
                  Court labels
                </label>
                <input
                  className={fieldClass()}
                  id="court-numbers"
                  name="courtNumbers"
                  placeholder="2, 3, Center"
                  defaultValue={value("courtNumbers")}
                />
                <p className="mt-1.5 text-sm text-muted">Optional names shown in Play.</p>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="notes">
                Note for players
              </label>
              <textarea
                className={`${fieldClass(notesError)} min-h-28 resize-y py-3`}
                id="notes"
                name="notes"
                maxLength={1200}
                defaultValue={value("notes")}
                placeholder="Parking tips, what to bring, or anything your crew should know…"
                aria-invalid={Boolean(notesError)}
                aria-describedby={notesError ? "notes-error" : undefined}
              />
              <FieldError id="notes-error" message={notesError} />
            </div>
            <div className="space-y-3">
              <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="requiresApproval"
                  defaultChecked={value("requiresApproval") === "on"}
                  className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
                />
                <span>
                  <strong className="block">Approve players before they join</strong>
                  <span className="mt-0.5 block text-muted">
                    Useful when the link may be shared beyond the original group.
                  </span>
                </span>
              </label>
              <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="booked"
                  defaultChecked={value("booked") === "on"}
                  className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
                />
                <span>
                  <strong className="block">Court is already booked</strong>
                  <span className="mt-0.5 block text-muted">
                    You can add a reference or screenshot after publishing.
                  </span>
                </span>
              </label>
            </div>
          </div>
        ) : null}
      </section>

      <SessionFormActions />
    </form>
  );
}
