"use client";

import { MapPin, Minus, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonSpinner } from "@/components/ui/button";
import {
  DatePickerField,
  TimePickerField,
} from "@/components/ui/date-time-picker";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";
import {
  type CourtSuggestion,
  VenueCombobox,
} from "@/features/venues/venue-combobox";

import { createSessionAction, type SessionActionState } from "./actions";
import { CreateGameProgress } from "./create-game-progress";
import { SessionAccentPicker } from "./session-accent-picker";

const labelClass = "block text-sm font-[650]";
const manilaDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const anonymousDraftStorageKey = "relay-game-draft-v1";

const stepFields: Record<number, string[]> = {
  1: ["title", "venue", "date", "start", "end"],
  2: ["capacity", "courts", "visibility", "costKind", "cost"],
  3: ["notes", "booked", "bookingReference", "bookingTotal", "bookingNotes"],
};

function creationBoundary(value: Date) {
  const parts = Object.fromEntries(
    manilaDateTimeFormatter
      .formatToParts(value)
      .map((part) => [part.type, part.value])
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const nextQuarter = (Math.floor(minutes / 15) + 1) * 15;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time:
      nextQuarter >= 24 * 60
        ? "24:00"
        : `${String(Math.floor(nextQuarter / 60)).padStart(2, "0")}:${String(nextQuarter % 60).padStart(2, "0")}`,
  };
}

function fieldClass(error?: string, multiline = false) {
  return `mt-1.5 w-full rounded-lg border bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:outline-none ${multiline ? "min-h-20 resize-y py-3" : "h-11"} ${error ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

function errorFor(
  state: SessionActionState,
  clientErrors: Record<string, string>,
  field: string
) {
  if (Object.hasOwn(clientErrors, field))
    return clientErrors[field] || undefined;
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
  const [value, setValue] = useState(
    initialValue == null ? "" : String(initialValue)
  );
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
  venueId?: string;
  venueAddress?: string;
  capacity?: number;
  courts?: number;
  start?: string;
  end?: string;
  cost?: number;
  accentColor?: string;
  visibility?: "public" | "link" | "private";
  requiresApproval?: boolean;
  groupId?: string;
  groupName?: string;
  sourceSessionId?: string;
  inviteeCount?: number;
};

type ReviewValues = {
  title: string;
  venue: string;
  schedule: string;
  setup: string;
  access: string;
  cost: string;
  details: string;
  booking: string;
};

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="intent"
      value="publish"
      className="min-h-11 w-full sm:min-h-9 sm:w-auto sm:min-w-40"
      disabled={pending}
    >
      {pending ? (
        <>
          <ButtonSpinner />
          Publishing…
        </>
      ) : (
        "Publish game"
      )}
    </Button>
  );
}

function reviewFromDraft(values: Record<string, string>): ReviewValues | null {
  if (!values.title || !values.venue || !values.date) return null;
  const courtCount = Number(values.courts);
  const cost = Number(values.cost);
  return {
    title: values.title,
    venue: values.venue,
    schedule: `${values.date} · ${values.start}–${values.end}`,
    setup: `${values.capacity} players · ${values.courts} ${courtCount === 1 ? "court" : "courts"}`,
    access:
      values.visibility === "public"
        ? values.requiresApproval === "on"
          ? "Public · Host approval required"
          : "Public · Players join directly"
        : values.visibility === "private"
          ? "Private · Invited players only"
          : "Anyone with the link",
    cost:
      values.costKind === "free"
        ? "Free"
        : values.costKind === "estimated"
          ? `${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(cost)} estimated per player`
          : "Not provided",
    details:
      values.courtNumbers ||
      values.notes ||
      (values.accentColor && values.accentColor !== "violet")
        ? "Optional game details added"
        : "No optional details added",
    booking:
      values.booked === "on" ? "Court booked" : "Booking details not added",
  };
}

function CreateSessionFormContent({
  defaults,
  now,
  courts,
  isAuthenticated,
  initialValues,
}: {
  defaults: CreateSessionDefaults;
  now?: string;
  courts: CourtSuggestion[];
  isAuthenticated: boolean;
  initialValues?: Record<string, string>;
}) {
  const [state, action] = useActionState(createSessionAction, {});
  const [step, setStep] = useState(initialValues ? 4 : 1);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<"public" | "link" | "private">(
    (initialValues?.visibility as "public" | "link" | "private") ??
      defaults.visibility ??
      "link"
  );
  const [costKind, setCostKind] = useState<
    "unspecified" | "free" | "estimated"
  >(
    (initialValues?.costKind as "unspecified" | "free" | "estimated") ??
      (defaults.cost === 0
        ? "free"
        : defaults.cost != null
          ? "estimated"
          : "unspecified")
  );
  const [review, setReview] = useState<ReviewValues | null>(() =>
    initialValues ? reviewFromDraft(initialValues) : null
  );
  const [booked, setBooked] = useState(
    (state.values?.booked ?? initialValues?.booked) === "on"
  );
  const formRef = useRef<HTMLFormElement>(null);
  const preserveValues = usePreserveFormValuesOnError(state);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const value = (field: string, initial?: string | number) =>
    state.values
      ? (state.values[field] ?? "")
      : (initialValues?.[field] ?? (initial == null ? "" : String(initial)));
  const [date, setDate] = useState(() => value("date", defaults.date));
  const [start, setStart] = useState(() => value("start", defaults.start));
  const [end, setEnd] = useState(() => value("end", defaults.end));
  const boundary = creationBoundary(now ? new Date(now) : new Date());
  const sameDayMinimum = date === boundary.date ? boundary.time : undefined;

  useEffect(() => {
    const firstInvalid = Object.entries(state.fieldErrors ?? {}).find(
      ([, messages]) => messages.length
    )?.[0];
    if (!firstInvalid) return;
    const invalidStep = Object.entries(stepFields).find(([, fields]) =>
      fields.includes(firstInvalid)
    )?.[0];
    window.requestAnimationFrame(() => {
      setClientErrors({});
      if (invalidStep) setStep(Number(invalidStep));
      window.requestAnimationFrame(() =>
        document.getElementById(firstInvalid)?.focus()
      );
    });
  }, [state.fieldErrors]);

  function focusStep(next: number) {
    setStep(next);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function focusField(field: string) {
    window.requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>(
        `[name="${field}"], #${field}`
      );
      target?.focus();
    });
  }

  function continueAfterAuthentication(destination: "login" | "signup") {
    const form = formRef.current;
    if (!form) return;
    const values = Object.fromEntries(
      Array.from(new FormData(form).entries(), ([key, entry]) => [
        key,
        String(entry),
      ])
    );
    localStorage.setItem(
      anonymousDraftStorageKey,
      JSON.stringify({ version: 1, values })
    );
    const next = encodeURIComponent("/games/new?resume=draft");
    window.location.assign(`/${destination}?next=${next}`);
  }

  function clearFieldError(...fields: string[]) {
    setClientErrors((current) => {
      const next = { ...current };
      for (const field of fields) next[field] = "";
      return next;
    });
  }

  function validatePlan(data: FormData) {
    const errors: Record<string, string> = {};
    const title = String(data.get("title") ?? "").trim();
    const venue = String(data.get("venue") ?? "").trim();
    if (title.length < 2)
      errors.title = "Add a game name with at least 2 characters.";
    if (venue.length < 2) errors.venue = "Add the court name.";
    if (!date) errors.date = "Choose a date.";
    if (!start) errors.start = "Choose a start time.";
    if (!end) errors.end = "Choose an end time.";
    if (date && start && end) {
      const startsAt = new Date(`${date}T${start}:00+08:00`);
      const endsAt = new Date(`${date}T${end}:00+08:00`);
      if (endsAt <= startsAt) errors.end = "End time must be after start time.";
      if (startsAt <= new Date(now ?? Date.now()))
        errors.start = "Start time must be in the future.";
    }
    return errors;
  }

  function validateAccess(data: FormData) {
    const errors: Record<string, string> = {};
    const capacity = Number(data.get("capacity"));
    const courtCount = Number(data.get("courts"));
    const amount = Number(data.get("cost"));
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 40)
      errors.capacity = "Choose a whole-number player limit from 2 to 40.";
    if (!Number.isInteger(courtCount) || courtCount < 1 || courtCount > 20)
      errors.courts = "Choose a whole-number court quantity from 1 to 20.";
    if (visibility === "public" && costKind === "unspecified")
      errors.costKind =
        "Public games must be marked free or include an estimated cost per player.";
    if (
      costKind === "estimated" &&
      (!Number.isFinite(amount) || amount <= 0 || amount > 100_000)
    )
      errors.cost = "Enter an estimated cost from ₱0.01 to ₱100,000.";
    return errors;
  }

  function continueFromPlan() {
    const data = new FormData(formRef.current!);
    const errors = validatePlan(data);
    setClientErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) return focusField(first);
    focusStep(2);
  }

  function continueFromAccess() {
    const data = new FormData(formRef.current!);
    const errors = validateAccess(data);
    setClientErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) return focusField(first);
    const amount = Number(data.get("cost"));
    setReview({
      title: String(data.get("title")),
      venue: String(data.get("venue")),
      schedule: `${date} · ${start}–${end}`,
      setup: `${data.get("capacity")} players · ${data.get("courts")} ${Number(data.get("courts")) === 1 ? "court" : "courts"}`,
      access:
        visibility === "public"
          ? data.get("requiresApproval") === "on"
            ? "Public · Host approval required"
            : "Public · Players join directly"
          : visibility === "link"
            ? "Anyone with the link"
            : "Private · Invited players only",
      cost:
        costKind === "free"
          ? "Free"
          : costKind === "estimated"
            ? `${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)} estimated per player`
            : "Not provided",
      details: "No optional details added",
      booking: "Booking details not added",
    });
    focusStep(3);
  }

  function continueFromDetails() {
    const data = new FormData(formRef.current!);
    const errors: Record<string, string> = {};
    const bookingTotal = String(data.get("bookingTotal") ?? "");
    const numericBookingTotal = Number(bookingTotal);
    if (
      booked &&
      bookingTotal &&
      (!Number.isFinite(numericBookingTotal) ||
        numericBookingTotal < 0 ||
        numericBookingTotal > 1_000_000)
    )
      errors.bookingTotal = "Enter a booking total from ₱0 to ₱1,000,000.";
    setClientErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) return focusField(first);

    const detailLabels = [
      String(data.get("courtNumbers") ?? "").trim()
        ? "Court labels added"
        : null,
      String(data.get("notes") ?? "").trim() ? "Player note added" : null,
      String(data.get("accentColor") ?? "violet") !== "violet"
        ? "Custom game color"
        : null,
    ].filter(Boolean);
    const reference = String(data.get("bookingReference") ?? "").trim();
    setReview((current) =>
      current
        ? {
            ...current,
            details: detailLabels.length
              ? detailLabels.join(" · ")
              : "No optional details added",
            booking: booked
              ? [
                  "Court booked",
                  reference ? `Reference ${reference}` : null,
                  bookingTotal ? `₱${bookingTotal}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Booking details not added",
          }
        : current
    );
    focusStep(4);
  }

  return (
    <form
      ref={formRef}
      className="mx-auto w-full max-w-2xl"
      action={action}
      onSubmitCapture={preserveValues}
      autoComplete="off"
      noValidate
      onChange={(event) => {
        const target: EventTarget = event.target;
        if (
          !(target instanceof HTMLInputElement) &&
          !(target instanceof HTMLTextAreaElement) &&
          !(target instanceof HTMLSelectElement)
        )
          return;
        const field = target.name;
        if (field)
          clearFieldError(
            field === "venueId" || field === "venueAddress" ? "venue" : field
          );
      }}
    >
      {defaults.groupId ? (
        <input type="hidden" name="groupId" value={defaults.groupId} />
      ) : null}
      {defaults.sourceSessionId ? (
        <input
          type="hidden"
          name="sourceSessionId"
          value={defaults.sourceSessionId}
        />
      ) : null}
      <CreateGameProgress step={step} />

      {state.error ? (
        <div
          role="alert"
          className="mb-6 rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/15"
        >
          {state.error}
        </div>
      ) : null}

      {defaults.sourceSessionId ? (
        <section className="mb-6 border-y border-line py-4">
          <p className="text-sm font-semibold">Previous game ready</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {defaults.inviteeCount
              ? `${defaults.inviteeCount} signed-in ${defaults.groupName ? (defaults.inviteeCount === 1 ? "group member" : "group members") : defaults.inviteeCount === 1 ? "player" : "players"} will receive a fresh invitation when you publish. `
              : "No signed-in players can be invited automatically, but you can still share the new game. "}
            The plan is copied; choose a new date. Previous responses, booking,
            payments, and scores stay behind.
          </p>
        </section>
      ) : defaults.groupName ? (
        <section className="mb-6 border-y border-line py-4">
          <p className="text-sm font-semibold">For {defaults.groupName}</p>
          <p className="mt-1 text-sm text-muted">
            {defaults.inviteeCount
              ? `${defaults.inviteeCount} group ${defaults.inviteeCount === 1 ? "member" : "members"} will be invited when you publish.`
              : "No other members yet. Add players from the group page or share the game link."}
          </p>
        </section>
      ) : null}

      <section
        hidden={step !== 1}
        aria-labelledby="create-plan-heading"
        className="space-y-6"
      >
        <div>
          <h2
            ref={step === 1 ? headingRef : undefined}
            tabIndex={-1}
            id="create-plan-heading"
            className="text-xl font-[680] outline-none"
          >
            The plan
          </h2>
          <p className="mt-1 text-sm text-muted">
            Start with what players need to recognize the game and arrive on
            time.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="title">
            Game name
          </label>
          <input
            className={fieldClass(errorFor(state, clientErrors, "title"))}
            id="title"
            name="title"
            required
            minLength={2}
            maxLength={80}
            placeholder="Enter a game name"
            defaultValue={value("title", defaults.title)}
            aria-invalid={Boolean(errorFor(state, clientErrors, "title"))}
            aria-describedby={
              errorFor(state, clientErrors, "title")
                ? "title-error"
                : "title-hint"
            }
          />
          <p id="title-hint" className="mt-1.5 text-sm text-muted">
            Use a name your group will recognize.
          </p>
          <FieldError
            id="title-error"
            message={errorFor(state, clientErrors, "title")}
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className={labelClass} htmlFor="venue">
              Court
            </label>
            <Link
              href="/courts"
              className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[13px] font-semibold text-primary hover:bg-primary-soft"
            >
              <MapPin aria-hidden size={15} /> Find a court
            </Link>
          </div>
          <VenueCombobox
            courts={courts}
            defaultValue={value("venue", defaults.venue)}
            defaultVenueId={value("venueId", defaults.venueId)}
            defaultAddress={value("venueAddress", defaults.venueAddress)}
            error={errorFor(state, clientErrors, "venue")}
            onValueChange={() => clearFieldError("venue")}
          />
          <FieldError
            id="venue-error"
            message={errorFor(state, clientErrors, "venue")}
          />
        </div>
        <div>
          <DatePickerField
            id="date"
            label="Date"
            value={date}
            minValue={boundary.date}
            todayValue={boundary.date}
            onValueChange={(nextDate) => {
              setDate(nextDate);
              setStart("");
              setEnd("");
              clearFieldError("date", "start", "end");
            }}
            error={errorFor(state, clientErrors, "date")}
            describedBy={
              errorFor(state, clientErrors, "date") ? "date-error" : undefined
            }
          />
          <FieldError
            id="date-error"
            message={errorFor(state, clientErrors, "date")}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
          <div>
            <TimePickerField
              id="start"
              label="Start time"
              value={start}
              minValue={sameDayMinimum}
              beforeValue={end || undefined}
              onValueChange={(next) => {
                setStart(next);
                clearFieldError("start", "end");
              }}
              error={errorFor(state, clientErrors, "start")}
            />
            <FieldError
              id="start-error"
              message={errorFor(state, clientErrors, "start")}
            />
          </div>
          <div>
            <TimePickerField
              id="end"
              label="End time"
              value={end}
              minValue={sameDayMinimum}
              afterValue={start || undefined}
              onValueChange={(next) => {
                setEnd(next);
                clearFieldError("end");
              }}
              error={errorFor(state, clientErrors, "end")}
            />
            <FieldError
              id="end-error"
              message={errorFor(state, clientErrors, "end")}
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-line pt-6">
          <Button
            type="button"
            onClick={continueFromPlan}
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Continue to players
          </Button>
        </div>
      </section>

      <section
        hidden={step !== 2}
        aria-labelledby="create-access-heading"
        className="space-y-7"
      >
        <div>
          <h2
            ref={step === 2 ? headingRef : undefined}
            tabIndex={-1}
            id="create-access-heading"
            className="text-xl font-[680] outline-none"
          >
            Players and access
          </h2>
          <p className="mt-1 text-sm text-muted">
            Set the roster limit, who can find the game, and what joining costs.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
          <QuantityInput
            id="capacity"
            label="Player limit"
            hint="2–40 players. Extra players join the waitlist."
            min={2}
            max={40}
            initialValue={
              value("capacity", defaults.capacity)
                ? Number(value("capacity", defaults.capacity))
                : undefined
            }
            error={errorFor(state, clientErrors, "capacity")}
          />
          <QuantityInput
            id="courts"
            label="Court quantity"
            hint="1–20 courts. You can label them later."
            min={1}
            max={20}
            initialValue={
              value("courts", defaults.courts)
                ? Number(value("courts", defaults.courts))
                : undefined
            }
            error={errorFor(state, clientErrors, "courts")}
          />
        </div>
        <fieldset>
          <legend className={labelClass}>Who can find this game?</legend>
          <div className="mt-2 divide-y divide-line border-y border-line">
            {[
              [
                "public",
                "Public",
                "Listed in Open games. Anyone can view and respond.",
              ],
              [
                "link",
                "Anyone with the link",
                "Not listed publicly. People with the shared link can respond.",
              ],
              [
                "private",
                "Private",
                "Only invited Relay players can access and respond.",
              ],
            ].map(([value, title, description]) => (
              <label
                key={value}
                className="flex min-h-16 cursor-pointer items-start gap-3 py-3"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={visibility === value}
                  onChange={() => setVisibility(value as typeof visibility)}
                  className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
                />
                <span>
                  <strong className="block text-sm">{title}</strong>
                  <span className="mt-0.5 block text-sm leading-5 text-muted">
                    {description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset
          aria-describedby={
            errorFor(state, clientErrors, "costKind")
              ? "cost-kind-error"
              : "cost-kind-hint"
          }
        >
          <legend className={labelClass}>Cost expectation</legend>
          <p id="cost-kind-hint" className="mt-1 text-sm text-muted">
            Public players must know the expected cost before joining.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 ${costKind === "free" ? "border-primary bg-primary-soft" : "border-line"}`}
            >
              <input
                type="radio"
                name="costKind"
                value="free"
                checked={costKind === "free"}
                onChange={() => setCostKind("free")}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              <span className="text-sm font-semibold">Free</span>
            </label>
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 ${costKind === "estimated" ? "border-primary bg-primary-soft" : "border-line"}`}
            >
              <input
                type="radio"
                name="costKind"
                value="estimated"
                checked={costKind === "estimated"}
                onChange={() => setCostKind("estimated")}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              <span className="text-sm font-semibold">
                Estimated per player
              </span>
            </label>
            {visibility !== "public" ? (
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 sm:col-span-2 ${costKind === "unspecified" ? "border-primary bg-primary-soft" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="costKind"
                  value="unspecified"
                  checked={costKind === "unspecified"}
                  onChange={() => setCostKind("unspecified")}
                  className="h-5 w-5 accent-[var(--primary)]"
                />
                <span className="text-sm font-semibold">Not provided yet</span>
              </label>
            ) : null}
          </div>
          <FieldError
            id="cost-kind-error"
            message={errorFor(state, clientErrors, "costKind")}
          />
          {costKind === "estimated" ? (
            <div className="mt-4">
              <label className={labelClass} htmlFor="cost">
                Estimated cost per player
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-[14px] text-muted">
                  ₱
                </span>
                <input
                  className={`${fieldClass(errorFor(state, clientErrors, "cost"))} score pl-8`}
                  id="cost"
                  name="cost"
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="300"
                  defaultValue={value(
                    "cost",
                    defaults.cost == null ? "" : String(defaults.cost)
                  )}
                  aria-invalid={Boolean(errorFor(state, clientErrors, "cost"))}
                />
              </div>
              <FieldError
                id="cost-error"
                message={errorFor(state, clientErrors, "cost")}
              />
            </div>
          ) : (
            <input
              type="hidden"
              name="cost"
              value={costKind === "free" ? "0" : ""}
            />
          )}
        </fieldset>
        <label className="flex min-h-12 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="requiresApproval"
            defaultChecked={
              value(
                "requiresApproval",
                defaults.requiresApproval ? "on" : ""
              ) === "on"
            }
            className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
          />
          <span>
            <strong className="block text-sm">
              Approve players before they join
            </strong>
            <span className="mt-0.5 block text-sm text-muted">
              Join requests stay pending until a host approves them.
            </span>
          </span>
        </label>
        <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => focusStep(1)}
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={continueFromAccess}
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Continue to details
          </Button>
        </div>
      </section>

      <section
        hidden={step !== 3}
        aria-labelledby="create-details-heading"
        className="space-y-7"
      >
        <div>
          <h2
            ref={step === 3 ? headingRef : undefined}
            tabIndex={-1}
            id="create-details-heading"
            className="text-xl font-[680] outline-none"
          >
            Optional details
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Add what you know now or skip this step. You can add or change
            everything here later in Settings.
          </p>
        </div>

        <SessionAccentPicker
          defaultValue={value("accentColor", defaults.accentColor ?? "violet")}
        />
        <div>
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
          <p className="mt-1.5 text-sm text-muted">
            Optional names shown in Play.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="notes">
            Note for players
          </label>
          <textarea
            className={fieldClass(errorFor(state, clientErrors, "notes"), true)}
            id="notes"
            name="notes"
            rows={2}
            maxLength={1200}
            defaultValue={value("notes")}
            placeholder="Parking tips, what to bring, or anything your crew should know…"
            aria-invalid={Boolean(errorFor(state, clientErrors, "notes"))}
          />
          <FieldError
            id="notes-error"
            message={errorFor(state, clientErrors, "notes")}
          />
        </div>

        <div className="border-t border-line pt-7">
          <h3 className="font-semibold">Court booking</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Relay records the reservation; booking still happens directly with
            the venue.
          </p>
          <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="booked"
              checked={booked}
              onChange={(event) => {
                setBooked(event.target.checked);
                clearFieldError(
                  "booked",
                  "bookingReference",
                  "bookingTotal",
                  "bookingNotes"
                );
              }}
              className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
            />
            <span>
              <strong className="block">Court is already booked</strong>
              <span className="mt-0.5 block text-muted">
                Add the reservation details now, or return to them later.
              </span>
            </span>
          </label>
          <FieldError
            id="booked-error"
            message={errorFor(state, clientErrors, "booked")}
          />
          {booked ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="booking-reference">
                    Booking reference
                  </label>
                  <input
                    className={fieldClass(
                      errorFor(state, clientErrors, "bookingReference")
                    )}
                    id="booking-reference"
                    name="bookingReference"
                    maxLength={120}
                    placeholder="Optional"
                    defaultValue={value("bookingReference")}
                    aria-invalid={Boolean(
                      errorFor(state, clientErrors, "bookingReference")
                    )}
                  />
                  <FieldError
                    id="booking-reference-error"
                    message={errorFor(state, clientErrors, "bookingReference")}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="booking-total">
                    Booking total
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-[14px] text-muted">
                      ₱
                    </span>
                    <input
                      className={`${fieldClass(errorFor(state, clientErrors, "bookingTotal"))} score pl-8`}
                      id="booking-total"
                      name="bookingTotal"
                      type="number"
                      min="0"
                      max="1000000"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="2400"
                      defaultValue={value("bookingTotal")}
                      aria-invalid={Boolean(
                        errorFor(state, clientErrors, "bookingTotal")
                      )}
                    />
                  </div>
                  <FieldError
                    id="booking-total-error"
                    message={errorFor(state, clientErrors, "bookingTotal")}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="booking-notes">
                  Booking notes
                </label>
                <textarea
                  className={fieldClass(
                    errorFor(state, clientErrors, "bookingNotes"),
                    true
                  )}
                  id="booking-notes"
                  name="bookingNotes"
                  rows={2}
                  maxLength={600}
                  placeholder="Reservation name, court access, or arrival instructions…"
                  defaultValue={value("bookingNotes")}
                  aria-invalid={Boolean(
                    errorFor(state, clientErrors, "bookingNotes")
                  )}
                />
                <FieldError
                  id="booking-notes-error"
                  message={errorFor(state, clientErrors, "bookingNotes")}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => focusStep(2)}
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={continueFromDetails}
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Review game
          </Button>
        </div>
      </section>

      <section
        hidden={step !== 4}
        aria-labelledby="create-review-heading"
        className="space-y-7"
      >
        <div>
          <h2
            ref={step === 4 ? headingRef : undefined}
            tabIndex={-1}
            id="create-review-heading"
            className="text-xl font-[680] outline-none"
          >
            Review your game
          </h2>
          <p className="mt-1 text-sm text-muted">
            This step is read-only. Use Edit to change anything before
            publishing.
          </p>
        </div>
        {review ? (
          <div className="divide-y divide-line border-y border-line">
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <h3 className="font-semibold">Plan</h3>
                <p className="mt-1 text-sm text-muted">
                  {review.title} · {review.venue}
                </p>
                <p className="mt-1 text-sm text-muted">{review.schedule}</p>
              </div>
              <button
                type="button"
                onClick={() => focusStep(1)}
                className="min-h-9 text-sm font-semibold text-primary"
              >
                Edit
              </button>
            </div>
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <h3 className="font-semibold">Players and access</h3>
                <p className="mt-1 text-sm text-muted">{review.setup}</p>
                <p className="mt-1 text-sm text-muted">{review.access}</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  {review.cost}
                </p>
              </div>
              <button
                type="button"
                onClick={() => focusStep(2)}
                className="min-h-9 text-sm font-semibold text-primary"
              >
                Edit
              </button>
            </div>
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <h3 className="font-semibold">Details</h3>
                <p className="mt-1 text-sm text-muted">{review.details}</p>
                <p className="mt-1 text-sm text-muted">{review.booking}</p>
              </div>
              <button
                type="button"
                onClick={() => focusStep(3)}
                className="min-h-9 text-sm font-semibold text-primary"
              >
                Edit
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => focusStep(3)}
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
          >
            Back
          </Button>
          {isAuthenticated ? (
            <PublishButton />
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => continueAfterAuthentication("login")}
                className="min-h-11 w-full sm:min-h-9 sm:w-auto"
              >
                Log in
              </Button>
              <Button
                type="button"
                onClick={() => continueAfterAuthentication("signup")}
                className="min-h-11 w-full sm:min-h-9 sm:w-auto"
              >
                Create account and publish
              </Button>
            </div>
          )}
        </div>
        <p className="text-center text-xs leading-5 text-muted sm:text-right">
          {isAuthenticated
            ? "Publishing creates the link to share. You can change every optional detail later."
            : "Your draft stays in this browser. Sign in to own the game, publish it, and create the link to share."}
        </p>
      </section>
    </form>
  );
}

export function CreateSessionForm({
  defaults,
  now,
  courts = [],
  isAuthenticated = true,
  resumeAnonymousDraft = false,
}: {
  defaults: CreateSessionDefaults;
  now?: string;
  courts?: CourtSuggestion[];
  isAuthenticated?: boolean;
  resumeAnonymousDraft?: boolean;
}) {
  const [restoredValues, setRestoredValues] = useState<
    Record<string, string> | null | undefined
  >(resumeAnonymousDraft ? undefined : null);

  useEffect(() => {
    if (!resumeAnonymousDraft) return;
    try {
      const stored = JSON.parse(
        localStorage.getItem(anonymousDraftStorageKey) ?? "null"
      ) as { version?: number; values?: Record<string, string> } | null;
      setRestoredValues(
        stored?.version === 1 && stored.values ? stored.values : null
      );
    } catch {
      setRestoredValues(null);
    }
  }, [resumeAnonymousDraft]);

  if (restoredValues === undefined)
    return (
      <p role="status" className="py-12 text-center text-sm text-muted">
        Restoring your game draft…
      </p>
    );

  return (
    <CreateSessionFormContent
      defaults={defaults}
      now={now}
      courts={courts}
      isAuthenticated={isAuthenticated}
      initialValues={restoredValues ?? undefined}
    />
  );
}
