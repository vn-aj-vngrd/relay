"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { submitVenueAction } from "./actions";
import {
  courtDays,
  courtParkingOptions,
  type CourtPriceStatus,
  courtPriceStatusOptions,
  courtPriceUnitOptions,
  courtTimeOptions,
} from "./details";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

const amenities = ["Restrooms", "Showers", "Seating", "Water station", "Changing rooms", "Lockers", "Pro shop"];

function ErrorMessage({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <p className="mt-1.5 text-sm font-medium text-danger">{messages[0]}</p> : null;
}

function Optional() {
  return <span className="font-normal text-muted">Optional</span>;
}

export function VenueSubmissionForm() {
  const [state, action] = useActionState(submitVenueAction, {});
  const [priceStatus, setPriceStatus] = useState<CourtPriceStatus>("unknown");
  if (state.success)
    return (
      <section role="status" className="border-y border-line py-8">
        <h2 className="text-lg font-[680]">Thanks for helping players across the Philippines</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{state.success}</p>
      </section>
    );

  return (
    <form action={action} className="max-w-2xl space-y-9" noValidate>
      {state.error ? <Alert>{state.error}</Alert> : null}

      <fieldset className="space-y-5">
        <legend className="text-lg font-[680] text-ink">Location and source</legend>
        <p className="text-sm leading-6 text-muted">
          Start with enough information for Relay to identify the right place and avoid duplicate listings.
        </p>
        <div>
          <label htmlFor="name" className="text-sm font-[650]">
            Court name
          </label>
          <input id="name" name="name" required maxLength={120} className={inputClass} placeholder="Court name" />
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
            className={inputClass}
            placeholder="Street, barangay, or landmark"
          />
          <ErrorMessage messages={state.fieldErrors?.address} />
        </div>
        <div>
          <label htmlFor="city" className="text-sm font-[650]">
            Philippine city or municipality
          </label>
          <input id="city" name="city" required maxLength={80} className={inputClass} placeholder="Quezon City" />
          <p className="mt-1.5 text-sm text-muted">Court Finder accepts locations in the Philippines only.</p>
          <ErrorMessage messages={state.fieldErrors?.city} />
        </div>
        <div>
          <label htmlFor="officialUrl" className="text-sm font-[650]">
            Source or Google Maps link
          </label>
          <input
            id="officialUrl"
            name="officialUrl"
            type="url"
            required
            className={inputClass}
            placeholder="https://…"
          />
          <p className="mt-1.5 text-sm text-muted">Use a public page that helps an admin confirm this court.</p>
          <ErrorMessage messages={state.fieldErrors?.officialUrl} />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="text-lg font-[680] text-ink">Court details</legend>
        <p className="text-sm leading-6 text-muted">
          Add what you know. Leave anything uncertain blank instead of guessing.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="environment"
            name="environment"
            label="Setting"
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
              className={inputClass}
              placeholder="4"
            />
            <ErrorMessage messages={state.fieldErrors?.courtCount} />
          </div>
        </div>
        <div>
          <SelectField
            id="priceStatus"
            name="priceStatus"
            label="Pricing"
            value={priceStatus}
            onValueChange={(value) => setPriceStatus(value as CourtPriceStatus)}
            options={courtPriceStatusOptions}
          />
          <ErrorMessage messages={state.fieldErrors?.priceStatus} />
          {priceStatus === "paid" ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="priceAmount" className="text-sm font-[650]">
                  Starting price
                </label>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
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
                    required
                    className={`${inputClass} pl-8 font-mono tabular-nums`}
                    placeholder="500"
                  />
                </div>
                <ErrorMessage messages={state.fieldErrors?.priceAmount} />
              </div>
              <div>
                <label htmlFor="priceMax" className="text-sm font-[650]">
                  Maximum price <Optional />
                </label>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
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
                    className={`${inputClass} pl-8 font-mono tabular-nums`}
                    placeholder="650"
                  />
                </div>
                <ErrorMessage messages={state.fieldErrors?.priceMax} />
              </div>
              <div>
                <SelectField id="priceUnit" name="priceUnit" label="Pricing mode" options={courtPriceUnitOptions} />
                <ErrorMessage messages={state.fieldErrors?.priceUnit} />
              </div>
            </div>
          ) : null}
        </div>
        <fieldset>
          <legend className="text-sm font-[650]">
            Operating hours <Optional />
          </legend>
          <p className="mt-1.5 text-sm text-muted">
            Philippine time. Add each day so players can filter by their full booking window. Matching times mean open
            24 hours.
          </p>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {courtDays.map((day) => (
              <div
                key={day.value}
                className="grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 py-2"
              >
                <span className="text-sm font-semibold">{day.shortLabel}</span>
                <SelectField
                  id={`${day.key}Open`}
                  name={`${day.key}Open`}
                  label={`${day.label} opening time`}
                  hideLabel
                  options={courtTimeOptions}
                  className="mt-0"
                />
                <SelectField
                  id={`${day.key}Close`}
                  name={`${day.key}Close`}
                  label={`${day.label} closing time`}
                  hideLabel
                  options={courtTimeOptions}
                  className="mt-0"
                />
                <div className="col-span-2 col-start-2">
                  <ErrorMessage
                    messages={state.fieldErrors?.[`${day.key}Open`] ?? state.fieldErrors?.[`${day.key}Close`]}
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>
        <div>
          <SelectField id="parkingStatus" name="parkingStatus" label="Parking" options={courtParkingOptions} />
          <ErrorMessage messages={state.fieldErrors?.parkingStatus} />
        </div>
        <div>
          <span className="text-sm font-[650]">
            Amenities <Optional />
          </span>
          <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <label key={amenity} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  name="amenities"
                  value={amenity}
                  className="size-4 rounded border-line accent-primary"
                />
                {amenity}
              </label>
            ))}
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
              <input type="checkbox" name="paddleRental" className="size-4 rounded border-line accent-primary" />
              Paddle rental available
            </label>
          </div>
          <ErrorMessage messages={state.fieldErrors?.amenities} />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="text-lg font-[680] text-ink">Booking and contact</legend>
        <p className="text-sm leading-6 text-muted">
          Only add public business contact details—never a private person’s information.
        </p>
        <div>
          <label htmlFor="contact" className="text-sm font-[650]">
            Public phone or email <Optional />
          </label>
          <input
            id="contact"
            name="contact"
            maxLength={160}
            className={inputClass}
            placeholder="(032) 555 0123 or bookings@example.com"
          />
          <ErrorMessage messages={state.fieldErrors?.contact} />
        </div>
        <div>
          <label htmlFor="websiteUrl" className="text-sm font-[650]">
            Official website <Optional />
          </label>
          <input id="websiteUrl" name="websiteUrl" type="url" className={inputClass} placeholder="https://…" />
          <ErrorMessage messages={state.fieldErrors?.websiteUrl} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="socialUrl" className="text-sm font-[650]">
              Official social page <Optional />
            </label>
            <input id="socialUrl" name="socialUrl" type="url" className={inputClass} placeholder="https://…" />
            <ErrorMessage messages={state.fieldErrors?.socialUrl} />
          </div>
          <div>
            <label htmlFor="bookingUrl" className="text-sm font-[650]">
              Booking link <Optional />
            </label>
            <input id="bookingUrl" name="bookingUrl" type="url" className={inputClass} placeholder="https://…" />
            <ErrorMessage messages={state.fieldErrors?.bookingUrl} />
          </div>
        </div>
        <div>
          <label htmlFor="note" className="text-sm font-[650]">
            Notes for the reviewer <Optional />
          </label>
          <textarea
            id="note"
            name="note"
            maxLength={600}
            rows={4}
            className={`${inputClass} h-auto min-h-28 resize-y py-3`}
            placeholder="Recent changes, booking instructions, court surface, or anything else an admin should verify…"
          />
          <ErrorMessage messages={state.fieldErrors?.note} />
        </div>
      </fieldset>

      <div className="border-t border-line pt-5">
        <SubmitButton pendingLabel="Submitting…">Submit for review</SubmitButton>
        <p className="mt-3 text-xs leading-5 text-muted">
          Your suggestion stays private until Relay verifies and publishes it.
        </p>
      </div>
    </form>
  );
}
