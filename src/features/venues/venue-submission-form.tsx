"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { submitVenueAction } from "./actions";

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
        <p className="text-sm leading-6 text-muted">Add what you know. Leave anything uncertain blank instead of guessing.</p>
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
          <label htmlFor="priceRange" className="text-sm font-[650]">
            Price guidance <Optional />
          </label>
          <input
            id="priceRange"
            name="priceRange"
            maxLength={160}
            className={inputClass}
            placeholder="₱500 per court per hour; ₱600 after 6 PM"
          />
          <p className="mt-1.5 text-sm text-muted">Include the amount, whether it is per court or player, and peak rates.</p>
          <ErrorMessage messages={state.fieldErrors?.priceRange} />
        </div>
        <div>
          <label htmlFor="hours" className="text-sm font-[650]">
            Operating hours <Optional />
          </label>
          <textarea
            id="hours"
            name="hours"
            maxLength={240}
            rows={3}
            className={`${inputClass} h-auto min-h-24 resize-y py-3`}
            placeholder="Mon–Fri 6 AM–10 PM; Sat–Sun 7 AM–11 PM"
          />
          <ErrorMessage messages={state.fieldErrors?.hours} />
        </div>
        <div>
          <label htmlFor="parking" className="text-sm font-[650]">
            Parking details <Optional />
          </label>
          <input
            id="parking"
            name="parking"
            maxLength={160}
            className={inputClass}
            placeholder="Free on-site parking"
          />
          <ErrorMessage messages={state.fieldErrors?.parking} />
        </div>
        <div>
          <span className="text-sm font-[650]">Amenities <Optional /></span>
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
        <p className="text-sm leading-6 text-muted">Only add public business contact details—never a private person’s information.</p>
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
