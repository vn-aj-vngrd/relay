"use client";

import { useActionState } from "react";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";

import { updateVenueAction } from "./actions";

const field = "field";
const statuses = ["unverified", "pending", "verified", "rejected", "archived"];

export type AdminVenueDefaults = {
  id: string;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  environment: string | null;
  courtCount: number | null;
  priceRange: string | null;
  hours: Record<string, string> | null;
  parking: string | null;
  contact: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  bookingUrl: string | null;
  listingStatus: string;
  verificationNote: string | null;
};

export function AdminVenueForm({ venue }: { venue: AdminVenueDefaults }) {
  const [state, action] = useActionState(updateVenueAction, {});
  return (
    <form action={action} className="space-y-7" noValidate>
      <input type="hidden" name="venueId" value={venue.id} />
      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded-lg bg-success/8 px-4 py-3 text-sm font-medium text-success">
          {state.success}
        </p>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="text-sm font-semibold">
            Venue name
          </label>
          <input id="name" name="name" defaultValue={venue.name} className={field} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="text-sm font-semibold">
            Address
          </label>
          <input id="address" name="address" defaultValue={venue.address} className={field} required />
        </div>
        <div>
          <label htmlFor="latitude" className="text-sm font-semibold">
            Latitude
          </label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={venue.latitude ?? ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="longitude" className="text-sm font-semibold">
            Longitude
          </label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={venue.longitude ?? ""}
            className={field}
          />
        </div>
        <SelectField
          id="environment"
          name="environment"
          label="Setting"
          defaultValue={venue.environment ?? ""}
          options={[
            { value: "", label: "Not specified" },
            { value: "indoor", label: "Indoor" },
            { value: "semi-indoor", label: "Semi-indoor" },
            { value: "covered", label: "Covered" },
            { value: "outdoor", label: "Outdoor" },
          ]}
        />
        <div>
          <label htmlFor="courtCount" className="text-sm font-semibold">
            Court quantity
          </label>
          <input
            id="courtCount"
            name="courtCount"
            type="number"
            min="1"
            max="50"
            defaultValue={venue.courtCount ?? ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="priceRange" className="text-sm font-semibold">
            Price guidance
          </label>
          <input id="priceRange" name="priceRange" defaultValue={venue.priceRange ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="hours" className="text-sm font-semibold">
            Hours
          </label>
          <input id="hours" name="hours" defaultValue={venue.hours?.summary ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="parking" className="text-sm font-semibold">
            Parking
          </label>
          <input id="parking" name="parking" defaultValue={venue.parking ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="contact" className="text-sm font-semibold">
            Contact
          </label>
          <input id="contact" name="contact" defaultValue={venue.contact ?? ""} className={field} />
        </div>
      </section>

      <section className="grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="websiteUrl" className="text-sm font-semibold">
            Website
          </label>
          <input id="websiteUrl" name="websiteUrl" type="url" defaultValue={venue.websiteUrl ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="socialUrl" className="text-sm font-semibold">
            Official social page
          </label>
          <input id="socialUrl" name="socialUrl" type="url" defaultValue={venue.socialUrl ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="bookingUrl" className="text-sm font-semibold">
            External booking link
          </label>
          <input id="bookingUrl" name="bookingUrl" type="url" defaultValue={venue.bookingUrl ?? ""} className={field} />
        </div>
      </section>

      <section className="grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
        <SelectField
          id="listingStatus"
          name="listingStatus"
          label="Listing status"
          defaultValue={venue.listingStatus}
          options={statuses.map((status) => ({ value: status, label: status[0].toUpperCase() + status.slice(1) }))}
        />
        <div className="sm:col-span-2">
          <label htmlFor="verificationNote" className="text-sm font-semibold">
            Internal verification note
          </label>
          <textarea
            id="verificationNote"
            name="verificationNote"
            rows={4}
            maxLength={600}
            defaultValue={venue.verificationNote ?? ""}
            className={`${field} h-auto min-h-24 resize-y py-3`}
          />
          <p className="mt-1.5 text-xs text-muted">
            Required context for corrections or rejection. Never shown publicly.
          </p>
        </div>
      </section>
      <div className="border-t border-line pt-5">
        <SubmitButton pendingLabel="Saving…">Save venue</SubmitButton>
      </div>
    </form>
  );
}
