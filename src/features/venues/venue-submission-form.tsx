"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { ComboboxField } from "@/components/ui/combobox-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { submitVenueAction } from "./actions";
import {
  type CourtPriceStatus,
  courtAccessOptions,
  courtDays,
  courtOperationalStatusOptions,
  courtParkingOptions,
  courtPriceStatusOptions,
  courtPriceUnitOptions,
  courtReservationOptions,
  courtTimeOptions,
} from "./details";
import type { CourtListing } from "./directory";
import type { venueChangeGroups } from "./domain";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

const amenities = [
  "Restrooms",
  "Showers",
  "Seating",
  "Water station",
  "Changing rooms",
  "Lockers",
  "Pro shop",
];
const changeOptions = [
  { value: "identity", label: "Name or location" },
  { value: "status", label: "Operating status" },
  { value: "access", label: "Access or reservations" },
  { value: "hours", label: "Operating hours" },
  { value: "pricing", label: "Pricing" },
  { value: "facilities", label: "Courts or facilities" },
  { value: "parking", label: "Parking" },
  { value: "booking", label: "Booking or contact" },
] as const satisfies ReadonlyArray<{
  value: (typeof venueChangeGroups)[number];
  label: string;
}>;

type CourtChoice = Pick<CourtListing, "id" | "slug" | "name" | "address">;

function ErrorMessage({ messages }: { messages?: string[] }) {
  return messages?.[0] ? (
    <p className="mt-1.5 text-sm font-medium text-danger">{messages[0]}</p>
  ) : null;
}

function Optional() {
  return <span className="font-normal text-muted">Optional</span>;
}

function fieldIsVisible(
  requestType: "create" | "update",
  changes: string[],
  group: string
) {
  return requestType === "create" || changes.includes(group);
}

export function VenueSubmissionForm({
  courts,
  initialVenue,
}: {
  courts: CourtChoice[];
  initialVenue?: CourtListing;
}) {
  const router = useRouter();
  const [state, action] = useActionState(submitVenueAction, {});
  const [requestType, setRequestType] = useState<"create" | "update">(
    initialVenue ? "update" : "create"
  );
  const [changedFields, setChangedFields] = useState<string[]>([]);
  const [courtToUpdate, setCourtToUpdate] = useState("");
  const [priceStatus, setPriceStatus] = useState<CourtPriceStatus>(
    initialVenue?.priceStatus ?? "unknown"
  );
  const preserveValues = usePreserveFormValuesOnError(state);
  const periodForDay = (dayOfWeek: number) =>
    initialVenue?.operatingHours.find(
      (period) => period.dayOfWeek === dayOfWeek
    );

  if (state.success)
    return (
      <section role="status" className="border-y border-line py-8">
        <h2 className="text-lg font-[680]">
          Thanks for improving Court Finder
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          {state.success}
        </p>
        <Link
          href={initialVenue ? `/court/${initialVenue.slug}` : "/court"}
          className="mt-5 inline-flex text-sm font-semibold text-primary"
        >
          {initialVenue ? "Back to court details" : "Back to Court Finder"}
        </Link>
      </section>
    );

  return (
    <form
      action={action}
      onSubmitCapture={preserveValues}
      className="max-w-2xl space-y-9"
      noValidate
    >
      <input type="hidden" name="requestType" value={requestType} />
      <input type="hidden" name="venueId" value={initialVenue?.id ?? ""} />
      {state.error ? <Alert>{state.error}</Alert> : null}

      <fieldset>
        <legend className="text-lg font-[680] text-ink">
          What would you like to do?
        </legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border p-4 ${requestType === "create" ? "border-primary bg-primary-soft/60" : "border-line bg-surface"}`}
          >
            <input
              type="radio"
              name="requestTypeChoice"
              value="create"
              checked={requestType === "create"}
              onChange={() => {
                if (initialVenue) router.push("/court/suggest");
                else setRequestType("create");
              }}
              className="sr-only"
            />
            <span className="block text-sm font-[680]">
              Add a missing court
            </span>
            <span className="mt-1 block text-sm leading-5 text-muted">
              Share a place that is not in Court Finder yet.
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-xl border p-4 ${requestType === "update" ? "border-primary bg-primary-soft/60" : "border-line bg-surface"}`}
          >
            <input
              type="radio"
              name="requestTypeChoice"
              value="update"
              checked={requestType === "update"}
              onChange={() => setRequestType("update")}
              className="sr-only"
            />
            <span className="block text-sm font-[680]">
              Update a listed court
            </span>
            <span className="mt-1 block text-sm leading-5 text-muted">
              Correct a price, location, status, or other detail.
            </span>
          </label>
        </div>
      </fieldset>

      {requestType === "update" && !initialVenue ? (
        <section className="border-t border-line pt-8">
          <h2 className="text-lg font-[680]">Choose the court</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Type a court name or location to narrow the list, or open Court
            Finder and choose Suggest an update from a court page.
          </p>
          <ComboboxField
            id="court-to-update"
            name="courtToUpdate"
            label="Court"
            value={courtToUpdate}
            placeholder="Type a court name or location…"
            emptyMessage="No listed court matches that search. Try Court Finder or add it as a missing court."
            onValueChange={(id) => {
              setCourtToUpdate(id);
              const court = courts.find((item) => item.id === id);
              if (court)
                router.push(
                  `/court/suggest?court=${encodeURIComponent(court.slug)}`
                );
            }}
            options={courts.map((court) => ({
              value: court.id,
              label: court.name,
              description: court.address,
            }))}
          />
          <Link
            href="/court"
            className="mt-4 inline-flex text-sm font-semibold text-primary"
          >
            Browse Court Finder
          </Link>
        </section>
      ) : null}

      {requestType === "update" && initialVenue ? (
        <fieldset className="border-t border-line pt-8">
          <legend className="text-lg font-[680]">What changed?</legend>
          <p className="mt-2 text-sm leading-6 text-muted">
            Choose only the details that need review. Current public information
            stays unchanged until Relay verifies your source.
          </p>
          <div className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {changeOptions.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="changedFields"
                  value={option.value}
                  checked={changedFields.includes(option.value)}
                  onChange={(event) =>
                    setChangedFields((current) =>
                      event.target.checked
                        ? [...current, option.value]
                        : current.filter((value) => value !== option.value)
                    )
                  }
                  className="size-4 rounded border-line accent-primary"
                />
                {option.label}
              </label>
            ))}
          </div>
          <ErrorMessage messages={state.fieldErrors?.changedFields} />
        </fieldset>
      ) : null}

      {requestType === "create" || initialVenue ? (
        <>
          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "identity") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680] text-ink">
              Location and source
            </legend>
            <p className="text-sm leading-6 text-muted">
              Use the place’s public name and a precise address. Leave uncertain
              details blank instead of guessing.
            </p>
            <div>
              <label htmlFor="name" className="text-sm font-[650]">
                Court name
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={120}
                defaultValue={initialVenue?.name ?? ""}
                className={inputClass}
                placeholder="Court name"
              />
              <ErrorMessage messages={state.fieldErrors?.name} />
            </div>
            <div>
              <label htmlFor="address" className="text-sm font-[650]">
                Address or neighborhood
              </label>
              <input
                id="address"
                name="address"
                required
                maxLength={240}
                defaultValue={initialVenue?.address ?? ""}
                className={inputClass}
                placeholder="Street, barangay, or landmark"
              />
              <ErrorMessage messages={state.fieldErrors?.address} />
            </div>
            {requestType === "create" ? (
              <div>
                <label htmlFor="city" className="text-sm font-[650]">
                  Philippine city or municipality
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  maxLength={80}
                  className={inputClass}
                  placeholder="Quezon City"
                />
                <p className="mt-1.5 text-sm text-muted">
                  Court Finder accepts locations in the Philippines only.
                </p>
                <ErrorMessage messages={state.fieldErrors?.city} />
              </div>
            ) : (
              <input type="hidden" name="city" value="" />
            )}
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "status") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680]">Operating status</legend>
            <SelectField
              id="operationalStatus"
              name="operationalStatus"
              label="Current status"
              defaultValue={initialVenue?.operationalStatus ?? "unknown"}
              options={courtOperationalStatusOptions}
            />
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "access") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680]">
              Access and reservations
            </legend>
            <p className="text-sm leading-6 text-muted">
              Price and access are separate. A free court may still be
              residents-only, and a paid club may require membership.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                id="accessType"
                name="accessType"
                label="Who can use this court"
                defaultValue={initialVenue?.accessType ?? "unknown"}
                options={courtAccessOptions}
              />
              <SelectField
                id="reservationPolicy"
                name="reservationPolicy"
                label="How players get a court"
                defaultValue={initialVenue?.reservationPolicy ?? "unknown"}
                options={courtReservationOptions}
              />
            </div>
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "facilities") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680] text-ink">
              Courts and facilities
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                id="environment"
                name="environment"
                label="Setting"
                defaultValue={initialVenue?.environment ?? ""}
                options={[
                  { value: "", label: "I don’t know" },
                  { value: "indoor", label: "Indoor" },
                  { value: "covered", label: "Covered" },
                  { value: "semi-indoor", label: "Semi-indoor" },
                  { value: "outdoor", label: "Outdoor" },
                  { value: "mixed", label: "Mixed settings" },
                ]}
              />
              <div>
                <label htmlFor="courtCount" className="text-sm font-[650]">
                  Number of playable courts <Optional />
                </label>
                <input
                  id="courtCount"
                  name="courtCount"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="50"
                  defaultValue={initialVenue?.courtCount ?? ""}
                  className={inputClass}
                  placeholder="4"
                />
                <ErrorMessage messages={state.fieldErrors?.courtCount} />
              </div>
            </div>
            <div>
              <span className="text-sm font-[650]">
                Amenities <Optional />
              </span>
              <div className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {amenities.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="amenities"
                      value={amenity}
                      defaultChecked={initialVenue?.amenities.includes(amenity)}
                      className="size-4 rounded border-line accent-primary"
                    />
                    {amenity}
                  </label>
                ))}
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="paddleRental"
                    defaultChecked={initialVenue?.paddleRental}
                    className="size-4 rounded border-line accent-primary"
                  />
                  Paddle rental available
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "pricing") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680]">Pricing</legend>
            <SelectField
              id="priceStatus"
              name="priceStatus"
              label="Price type"
              value={priceStatus}
              onValueChange={(value) =>
                setPriceStatus(value as CourtPriceStatus)
              }
              options={courtPriceStatusOptions}
            />
            {priceStatus === "paid" ? (
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="priceAmount" className="text-sm font-[650]">
                    Starting price
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    >
                      ₱
                    </span>
                    <input
                      id="priceAmount"
                      name="priceAmount"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      defaultValue={
                        initialVenue?.priceAmountCents == null
                          ? ""
                          : initialVenue.priceAmountCents / 100
                      }
                      className={`${inputClass} pl-8 font-mono tabular-nums`}
                      placeholder="500"
                    />
                  </div>
                  <ErrorMessage messages={state.fieldErrors?.priceAmount} />
                </div>
                <div>
                  <label htmlFor="priceMax" className="text-sm font-[650]">
                    Maximum <Optional />
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    >
                      ₱
                    </span>
                    <input
                      id="priceMax"
                      name="priceMax"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      defaultValue={
                        initialVenue?.priceMaxCents == null
                          ? ""
                          : initialVenue.priceMaxCents / 100
                      }
                      className={`${inputClass} pl-8 font-mono tabular-nums`}
                      placeholder="650"
                    />
                  </div>
                  <ErrorMessage messages={state.fieldErrors?.priceMax} />
                </div>
                <SelectField
                  id="priceUnit"
                  name="priceUnit"
                  label="Pricing mode"
                  defaultValue={initialVenue?.priceUnit ?? ""}
                  options={courtPriceUnitOptions}
                />
              </div>
            ) : (
              <>
                <input type="hidden" name="priceAmount" value="" />
                <input type="hidden" name="priceMax" value="" />
                <input type="hidden" name="priceUnit" value="" />
              </>
            )}
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "hours") ? "" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680]">
              Operating hours <Optional />
            </legend>
            <p className="mt-2 text-sm leading-6 text-muted">
              Philippine time. Matching open and close times mean open 24 hours.
            </p>
            <div className="mt-3 divide-y divide-line border-y border-line">
              {courtDays.map((day) => {
                const period = periodForDay(day.value);
                return (
                  <div
                    key={day.value}
                    className="grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 py-2"
                  >
                    <span className="text-sm font-semibold">
                      {day.shortLabel}
                    </span>
                    <SelectField
                      id={`${day.key}Open`}
                      name={`${day.key}Open`}
                      label={`${day.label} opening time`}
                      hideLabel
                      defaultValue={period?.opensAt ?? ""}
                      options={courtTimeOptions}
                      className="mt-0"
                    />
                    <SelectField
                      id={`${day.key}Close`}
                      name={`${day.key}Close`}
                      label={`${day.label} closing time`}
                      hideLabel
                      defaultValue={period?.closesAt ?? ""}
                      options={courtTimeOptions}
                      className="mt-0"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "parking") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680]">Parking</legend>
            <SelectField
              id="parkingStatus"
              name="parkingStatus"
              label="Parking availability"
              defaultValue={initialVenue?.parkingStatus ?? ""}
              options={courtParkingOptions}
            />
          </fieldset>

          <fieldset
            className={`${fieldIsVisible(requestType, changedFields, "booking") ? "space-y-5" : "hidden"} border-t border-line pt-8`}
          >
            <legend className="text-lg font-[680]">Booking and contact</legend>
            <p className="text-sm leading-6 text-muted">
              Only add public business contact details—never a private person’s
              information.
            </p>
            <div>
              <label htmlFor="contact" className="text-sm font-[650]">
                Public phone or email <Optional />
              </label>
              <input
                id="contact"
                name="contact"
                maxLength={160}
                defaultValue={initialVenue?.contact ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="websiteUrl" className="text-sm font-[650]">
                Official website <Optional />
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                defaultValue={initialVenue?.websiteUrl ?? ""}
                className={inputClass}
                placeholder="https://…"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="socialUrl" className="text-sm font-[650]">
                  Official social page <Optional />
                </label>
                <input
                  id="socialUrl"
                  name="socialUrl"
                  type="url"
                  defaultValue={initialVenue?.socialUrl ?? ""}
                  className={inputClass}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label htmlFor="bookingUrl" className="text-sm font-[650]">
                  Booking link <Optional />
                </label>
                <input
                  id="bookingUrl"
                  name="bookingUrl"
                  type="url"
                  defaultValue={initialVenue?.bookingUrl ?? ""}
                  className={inputClass}
                  placeholder="https://…"
                />
              </div>
            </div>
          </fieldset>

          <section className="space-y-5 border-t border-line pt-8">
            <h2 className="text-lg font-[680]">Evidence</h2>
            <div>
              <label htmlFor="officialUrl" className="text-sm font-[650]">
                Official source or Google Maps link
              </label>
              <input
                id="officialUrl"
                name="officialUrl"
                type="url"
                required
                className={inputClass}
                placeholder="https://…"
              />
              <p className="mt-1.5 text-sm text-muted">
                Use a public page that helps Relay verify exactly what changed.
              </p>
              <ErrorMessage messages={state.fieldErrors?.officialUrl} />
            </div>
            <div>
              <label htmlFor="note" className="text-sm font-[650]">
                What should the reviewer know? <Optional />
              </label>
              <textarea
                id="note"
                name="note"
                maxLength={600}
                rows={4}
                className={`${inputClass} h-auto min-h-28 resize-y py-3`}
                placeholder="What changed, when you observed it, or where the relevant detail appears…"
              />
            </div>
          </section>

          <div className="border-t border-line pt-5">
            <SubmitButton pendingLabel="Submitting…">
              Submit for review
            </SubmitButton>
            <p className="mt-3 text-xs leading-5 text-muted">
              Your request stays private until Relay reviews the evidence.
              Public court information does not change automatically.
            </p>
          </div>
        </>
      ) : null}
    </form>
  );
}
