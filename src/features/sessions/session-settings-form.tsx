"use client";

import { useActionState, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import {
  DatePickerField,
  TimePickerField,
} from "@/components/ui/date-time-picker";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";
import { VenueCombobox } from "@/features/venues/venue-combobox";

import { type SessionActionState, updateSessionAction } from "./actions";
import { QuantityInput } from "./create-session-form";
import type { GameSettingsSection } from "./game-settings-tabs";
import { updateLiveSessionAction } from "./live-settings-actions";
import { SessionAccentPicker } from "./session-accent-picker";

const label = "block text-sm font-[650]";
const field =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function formatPlayerPrice(value: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

export type SessionSettingsDefaults = {
  id: string;
  version: number;
  title: string;
  accentColor: string;
  venue: string;
  venueId: string;
  venueAddress: string;
  date: string;
  start: string;
  end: string;
  capacity: number;
  courts: number;
  cost: string;
  notes: string;
  visibility: "public" | "link" | "private";
  requiresApproval: boolean;
  booked: boolean;
  bookingReference: string;
  bookingTotal: string;
  bookingNotes: string;
};

export function SessionSettingsForm({
  defaults,
  section = "plan",
  status = "published",
}: {
  defaults: SessionSettingsDefaults;
  status?: "draft" | "published" | "live" | "completed" | "cancelled";
  section?: Exclude<GameSettingsSection, "organizers">;
}) {
  const [state, action] = useActionState<SessionActionState, FormData>(
    status === "live" ? updateLiveSessionAction : updateSessionAction,
    {}
  );
  const preserveValues = usePreserveFormValuesOnError(state);
  const [booked, setBooked] = useState(
    state.values ? state.values.booked === "on" : defaults.booked
  );
  const [visibility, setVisibility] = useState<"public" | "link" | "private">(
    (state.values?.visibility as "public" | "link" | "private" | undefined) ??
      defaults.visibility
  );
  const [costKind, setCostKind] = useState<"unspecified" | "free" | "share">(
    defaults.cost && Number(defaults.cost) > 0
      ? "share"
      : state.values?.costKind === "free"
        ? "free"
        : state.values?.costKind === "unspecified"
          ? "unspecified"
          : Number(defaults.cost) === 0 && defaults.cost !== ""
            ? "free"
            : "unspecified"
  );
  const value = (key: keyof SessionSettingsDefaults) =>
    state.values?.[key] ?? String(defaults[key] ?? "");
  const error = (key: string) => state.fieldErrors?.[key]?.[0];
  const locked = status !== "draft" && status !== "published";
  const readOnly = status === "completed" || status === "cancelled";
  const canSave = !readOnly && (!locked || section !== "plan");

  return (
    <form
      action={action}
      onSubmitCapture={preserveValues}
      noValidate
      className="space-y-9"
    >
      <input type="hidden" name="sessionId" value={defaults.id} />
      <input type="hidden" name="version" value={defaults.version} />
      <input type="hidden" name="section" value={section} />
      {locked ? (
        <p role="status" className="text-sm leading-6 text-muted">
          {readOnly
            ? "This game has ended. Settings are view-only."
            : "The plan and access rules are locked during Play. You can still update the player note, booking details, and organizers."}
        </p>
      ) : null}
      {state.success ? <p role="status">Changes saved.</p> : null}
      {state.error ? (
        <div
          role="alert"
          className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.error}
        </div>
      ) : null}

      <fieldset
        disabled={locked}
        className="min-w-0"
        aria-labelledby="settings-plan"
        hidden={section !== "plan"}
      >
        <div className="mb-5">
          <h2 id="settings-plan" className="text-lg font-bold">
            Plan
          </h2>
          <p className="mt-1 text-sm text-muted">
            Changes appear on the invite and notify signed-in players.
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="settings-title" className={label}>
              Game name
            </label>
            <input
              id="settings-title"
              name="title"
              required
              maxLength={80}
              defaultValue={value("title")}
              className={field}
              aria-invalid={Boolean(error("title"))}
            />
            <ErrorText id="settings-title-error" message={error("title")} />
          </div>
          <div>
            <label htmlFor="venue" className={label}>
              Court
            </label>
            <VenueCombobox
              key={`${value("venue")}:${value("venueId")}:${value("venueAddress")}`}
              defaultValue={value("venue")}
              defaultVenueId={value("venueId")}
              defaultAddress={value("venueAddress")}
              error={error("venue")}
            />
            <ErrorText id="settings-venue-error" message={error("venue")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <DatePickerField
                key={value("date")}
                id="settings-date"
                name="date"
                label="Date"
                defaultValue={value("date")}
                error={error("date")}
                describedBy={error("date") ? "settings-date-error" : undefined}
              />
              <ErrorText id="settings-date-error" message={error("date")} />
            </div>
            <div>
              <TimePickerField
                key={value("start")}
                id="settings-start"
                name="start"
                label="Starts"
                defaultValue={value("start")}
                error={error("start")}
                describedBy={
                  error("start") ? "settings-start-error" : undefined
                }
              />
              <ErrorText id="settings-start-error" message={error("start")} />
            </div>
            <div>
              <TimePickerField
                key={value("end")}
                id="settings-end"
                name="end"
                label="Ends"
                defaultValue={value("end")}
                error={error("end")}
                describedBy={error("end") ? "settings-end-error" : undefined}
              />
              <ErrorText id="settings-end-error" message={error("end")} />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <QuantityInput
              id="capacity"
              label="Player limit"
              hint="Relay prevents saving below the number already going."
              min={2}
              max={40}
              initialValue={Number(value("capacity"))}
              error={error("capacity")}
            />
            <QuantityInput
              id="courts"
              label="Court quantity"
              hint="Existing match assignments are protected."
              min={1}
              max={20}
              initialValue={Number(value("courts"))}
              error={error("courts")}
            />
          </div>
        </div>
      </fieldset>

      <section
        id="settings-appearance"
        aria-labelledby="settings-sharing"
        hidden={section !== "invite"}
      >
        <fieldset disabled={locked} className="min-w-0">
          <div className="mb-5">
            <h2 id="settings-sharing" className="text-lg font-bold">
              Invite settings
            </h2>
            <p className="mt-1 text-sm text-muted">
              Customize the cover and keep the shared plan accurate before
              players arrive.
            </p>
          </div>
          <SessionAccentPicker defaultValue={value("accentColor")} />
          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <SelectField
              id="settings-visibility"
              name="visibility"
              label="Visibility"
              value={visibility}
              onValueChange={(next) => setVisibility(next as typeof visibility)}
              options={[
                { value: "link", label: "Anyone with the link" },
                { value: "public", label: "Public — eligible for Open games" },
                { value: "private", label: "Private — invited players only" },
              ]}
            />
            <fieldset>
              <legend className={label}>Player price</legend>
              {costKind === "share" ? (
                <div className="mt-2 rounded-lg border border-line px-3 py-2.5">
                  <input type="hidden" name="costKind" value="unspecified" />
                  <p className="score text-sm font-semibold">
                    {formatPlayerPrice(value("cost"))} per player
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Calculated from the current repayment split. Manage it in
                    Payments.
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["free", "Free"],
                    ["unspecified", "Not set yet"],
                  ].map(([kind, text]) => (
                    <label
                      key={kind}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold sm:min-h-10 ${costKind === kind ? "border-primary bg-primary-soft text-primary" : "border-line"}`}
                    >
                      <input
                        type="radio"
                        name="costKind"
                        value={kind}
                        checked={costKind === kind}
                        onChange={() => setCostKind(kind as typeof costKind)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      {text}
                    </label>
                  ))}
                </div>
              )}
              {visibility === "public" && costKind === "unspecified" ? (
                <p className="mt-2 text-sm text-muted">
                  This game stays out of Open games until you mark it Free or
                  create a repayment split.
                </p>
              ) : null}
              <ErrorText
                id="settings-cost-kind-error"
                message={error("costKind")}
              />
            </fieldset>
          </div>
          <input
            type="hidden"
            name="cost"
            value={costKind === "free" ? "0" : ""}
          />
        </fieldset>
        <div className="mt-6">
          <label htmlFor="settings-notes" className={label}>
            Note for players
          </label>
          <textarea
            id="settings-notes"
            name="notes"
            disabled={readOnly}
            maxLength={1200}
            defaultValue={value("notes")}
            className={`${field} min-h-28 resize-y py-3`}
            placeholder="Parking tips, what to bring, or anything the crew should know…"
          />
          <ErrorText id="settings-notes-error" message={error("notes")} />
        </div>
        <fieldset disabled={locked} className="min-w-0">
          <label className="mt-6 flex min-h-12 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="requiresApproval"
              defaultChecked={
                state.values
                  ? state.values.requiresApproval === "on"
                  : defaults.requiresApproval
              }
              className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
            />
            <span>
              <strong className="block text-sm">
                Approve new players before they join
              </strong>
              <span className="mt-0.5 block text-sm text-muted">
                Join requests stay pending until a host approves them. You can
                still remove players later.
              </span>
            </span>
          </label>
        </fieldset>
      </section>

      <fieldset
        disabled={readOnly}
        className="min-w-0"
        aria-labelledby="settings-booking"
        hidden={section !== "booking"}
      >
        <div className="mb-5">
          <h2 id="settings-booking" className="text-lg font-bold">
            Court booking
          </h2>
          <p className="mt-1 text-sm text-muted">
            Relay records the reservation; booking still happens with the venue.
          </p>
        </div>
        <label className="flex min-h-12 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="booked"
            checked={booked}
            onChange={(event) => setBooked(event.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
          />
          <span>
            <strong className="block text-sm">Court is booked</strong>
            <span className="mt-0.5 block text-sm text-muted">
              Show a confirmed booking status to players.
            </span>
          </span>
        </label>
        {booked ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-reference" className={label}>
                  Booking reference
                </label>
                <input
                  id="settings-reference"
                  name="bookingReference"
                  defaultValue={value("bookingReference")}
                  maxLength={120}
                  className={field}
                  placeholder="Optional"
                />
                <ErrorText
                  id="settings-reference-error"
                  message={error("bookingReference")}
                />
              </div>
              <div>
                <label htmlFor="settings-booking-total" className={label}>
                  Booking total
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-[14px] text-muted">
                    ₱
                  </span>
                  <input
                    id="settings-booking-total"
                    name="bookingTotal"
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={value("bookingTotal")}
                    className={`${field} score pl-8`}
                    placeholder="2400"
                  />
                </div>
                <ErrorText
                  id="settings-booking-total-error"
                  message={error("bookingTotal")}
                />
              </div>
            </div>
            <div>
              <label htmlFor="settings-booking-notes" className={label}>
                Booking notes
              </label>
              <textarea
                id="settings-booking-notes"
                name="bookingNotes"
                maxLength={600}
                rows={2}
                defaultValue={value("bookingNotes")}
                className={`${field} h-auto min-h-[4.5rem] resize-y py-3`}
                placeholder="Court access, reservation name, or arrival instructions…"
              />
              <ErrorText
                id="settings-booking-notes-error"
                message={error("bookingNotes")}
              />
            </div>
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-6">
        <ButtonLink href={`/games/${defaults.id}`} variant="secondary">
          {canSave ? "Cancel" : "Back to game"}
        </ButtonLink>
        {canSave ? (
          <SubmitButton pendingLabel="Saving changes…">
            Save changes
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}
