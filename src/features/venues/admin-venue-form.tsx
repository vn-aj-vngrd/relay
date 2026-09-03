"use client";

import { useActionState, useState } from "react";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { updateVenueAction } from "./actions";
import {
  type CourtAccessType,
  type CourtOperationalStatus,
  type CourtParkingStatus,
  type CourtPriceStatus,
  type CourtReservationPolicy,
  courtAccessOptions,
  courtDays,
  courtOperationalStatusOptions,
  courtParkingOptions,
  courtPriceStatusOptions,
  courtPriceUnitOptions,
  courtReservationOptions,
  courtTimeOptions,
} from "./details";

const field = "field";
const statuses = ["unverified", "pending", "verified", "rejected", "archived"];
const amenities = [
  "Restrooms",
  "Showers",
  "Seating",
  "Water station",
  "Changing rooms",
  "Lockers",
  "Pro shop",
];

export type AdminVenueDefaults = {
  id: string;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  environment: string | null;
  courtCount: number | null;
  accessType: CourtAccessType;
  reservationPolicy: CourtReservationPolicy;
  operationalStatus: CourtOperationalStatus;
  priceStatus: CourtPriceStatus;
  priceAmountCents: number | null;
  priceMaxCents: number | null;
  priceUnit: string | null;
  operatingHours: Array<{
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
  }>;
  parkingStatus: CourtParkingStatus | null;
  amenities: string[] | null;
  paddleRental: boolean;
  contact: string | null;
  sourceUrl: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  bookingUrl: string | null;
  listingStatus: string;
  verificationNote: string | null;
};

export function AdminVenueForm({ venue }: { venue: AdminVenueDefaults }) {
  const [state, action] = useActionState(updateVenueAction, {});
  const preserveValues = usePreserveFormValuesOnError(state);
  const periodForDay = (dayOfWeek: number) =>
    venue.operatingHours.find((period) => period.dayOfWeek === dayOfWeek);
  const [priceStatus, setPriceStatus] = useState<CourtPriceStatus>(
    venue.priceStatus
  );
  return (
    <form
      action={action}
      onSubmitCapture={preserveValues}
      className="space-y-7"
      noValidate
    >
      <input type="hidden" name="venueId" value={venue.id} />
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-danger/8 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-lg bg-success/8 px-4 py-3 text-sm font-medium text-success"
        >
          {state.success}
        </p>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="text-sm font-semibold">
            Court name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={venue.name}
            className={field}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="text-sm font-semibold">
            Address
          </label>
          <input
            id="address"
            name="address"
            defaultValue={venue.address}
            className={field}
            required
          />
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
            { value: "mixed", label: "Mixed settings" },
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
        <SelectField
          id="accessType"
          name="accessType"
          label="Who can use this court"
          defaultValue={venue.accessType}
          options={courtAccessOptions}
        />
        <SelectField
          id="reservationPolicy"
          name="reservationPolicy"
          label="How players get a court"
          defaultValue={venue.reservationPolicy}
          options={courtReservationOptions}
        />
        <SelectField
          id="operationalStatus"
          name="operationalStatus"
          label="Operating status"
          defaultValue={venue.operationalStatus}
          options={courtOperationalStatusOptions}
        />
        <SelectField
          id="priceStatus"
          name="priceStatus"
          label="Pricing"
          value={priceStatus}
          onValueChange={(value) => setPriceStatus(value as CourtPriceStatus)}
          options={courtPriceStatusOptions}
        />
        {priceStatus === "paid" ? (
          <div className="grid gap-5 sm:col-span-2 sm:grid-cols-3">
            <div>
              <label htmlFor="priceAmount" className="text-sm font-semibold">
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
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  defaultValue={
                    venue.priceAmountCents == null
                      ? ""
                      : venue.priceAmountCents / 100
                  }
                  className={`${field} pl-8 font-mono tabular-nums`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="priceMax" className="text-sm font-semibold">
                Maximum price
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
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  defaultValue={
                    venue.priceMaxCents == null ? "" : venue.priceMaxCents / 100
                  }
                  className={`${field} pl-8 font-mono tabular-nums`}
                />
              </div>
            </div>
            <SelectField
              id="priceUnit"
              name="priceUnit"
              label="Pricing mode"
              defaultValue={venue.priceUnit ?? ""}
              options={courtPriceUnitOptions}
            />
          </div>
        ) : null}
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold">Operating hours</legend>
          <p className="mt-1.5 text-sm text-muted">
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
                    defaultValue={period?.opensAt.slice(0, 5) ?? ""}
                    options={courtTimeOptions}
                    className="mt-0"
                  />
                  <SelectField
                    id={`${day.key}Close`}
                    name={`${day.key}Close`}
                    label={`${day.label} closing time`}
                    hideLabel
                    defaultValue={period?.closesAt.slice(0, 5) ?? ""}
                    options={courtTimeOptions}
                    className="mt-0"
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
        <SelectField
          id="parkingStatus"
          name="parkingStatus"
          label="Parking"
          defaultValue={venue.parkingStatus ?? ""}
          options={courtParkingOptions}
        />
        <div>
          <label htmlFor="contact" className="text-sm font-semibold">
            Contact
          </label>
          <input
            id="contact"
            name="contact"
            defaultValue={venue.contact ?? ""}
            className={field}
          />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold">Amenities</legend>
          <div className="mt-2 grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <label
                key={amenity}
                className="flex min-h-10 cursor-pointer items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="amenities"
                  value={amenity}
                  defaultChecked={venue.amenities?.includes(amenity)}
                  className="size-4 rounded border-line accent-primary"
                />
                {amenity}
              </label>
            ))}
            <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="paddleRental"
                defaultChecked={venue.paddleRental}
                className="size-4 rounded border-line accent-primary"
              />
              Paddle rental available
            </label>
          </div>
        </fieldset>
      </section>

      <section className="grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sourceUrl" className="text-sm font-semibold">
            Verification source
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            defaultValue={venue.sourceUrl ?? ""}
            className={field}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="websiteUrl" className="text-sm font-semibold">
            Website
          </label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={venue.websiteUrl ?? ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="socialUrl" className="text-sm font-semibold">
            Official social page
          </label>
          <input
            id="socialUrl"
            name="socialUrl"
            type="url"
            defaultValue={venue.socialUrl ?? ""}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="bookingUrl" className="text-sm font-semibold">
            External booking link
          </label>
          <input
            id="bookingUrl"
            name="bookingUrl"
            type="url"
            defaultValue={venue.bookingUrl ?? ""}
            className={field}
          />
        </div>
      </section>

      <section className="grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
        <SelectField
          id="listingStatus"
          name="listingStatus"
          label="Listing status"
          defaultValue={venue.listingStatus}
          options={statuses.map((status) => ({
            value: status,
            label: status[0].toUpperCase() + status.slice(1),
          }))}
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
        <SubmitButton pendingLabel="Saving…">Save court</SubmitButton>
      </div>
    </form>
  );
}
