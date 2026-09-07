"use client";

import { useId, useState } from "react";

import { SelectField } from "@/components/ui/select-field";

const input =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function PaymentSetupFields({
  bookingTotalCents = null,
  defaults = {},
  totalReadOnly = false,
}: {
  bookingTotalCents?: number | null;
  defaults?: Record<string, string>;
  totalReadOnly?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-semibold" htmlFor={`${id}-label`}>
          Expense
        </label>
        <input
          className={input}
          id={`${id}-label`}
          name="label"
          maxLength={80}
          defaultValue={defaults.label ?? "Court"}
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor={`${id}-total`}>
          Total amount
        </label>
        <input
          className={`${input} score`}
          id={`${id}-total`}
          name="total"
          readOnly={totalReadOnly}
          type="number"
          min="0.01"
          max="1000000"
          step="0.01"
          required
          inputMode="decimal"
          autoComplete="off"
          defaultValue={
            defaults.total ??
            (bookingTotalCents == null ? undefined : bookingTotalCents / 100)
          }
          placeholder="2400"
        />
        {bookingTotalCents != null ? (
          <p className="mt-1.5 text-sm text-muted">
            Prefilled from the court booking. Confirm or change it here.
          </p>
        ) : null}
      </div>
      <SelectField
        id={`${id}-method`}
        name="method"
        label="Payment method"
        defaultValue={defaults.method ?? "GCash"}
        options={[
          { value: "GCash", label: "GCash" },
          { value: "Maya", label: "Maya" },
          { value: "Bank transfer", label: "Bank transfer" },
          { value: "Cash", label: "Cash" },
          { value: "Custom", label: "Custom" },
        ]}
      />
      <div>
        <label className="text-sm font-semibold" htmlFor={`${id}-details`}>
          Payment details
        </label>
        <textarea
          className="mt-1.5 min-h-24 w-full rounded-lg border border-line bg-surface p-3.5"
          id={`${id}-details`}
          name="details"
          defaultValue={defaults.details ?? ""}
          maxLength={300}
          required
          autoComplete="off"
          placeholder="Account name and number…"
        />
      </div>
    </div>
  );
}

export function PlayerPaymentFields({
  defaults = {},
  bookingTotalCents = null,
}: {
  defaults?: Record<string, string>;
  bookingTotalCents?: number | null;
}) {
  const [choice, setChoice] = useState(defaults.costKind ?? "unspecified");
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-2 text-sm font-semibold">
        Player payment (optional)
      </legend>
      <SelectField
        id="costKind"
        name="costKind"
        label="Payment choice"
        value={choice}
        onValueChange={setChoice}
        options={[
          { value: "unspecified", label: "Decide later" },
          { value: "free", label: "Free" },
          { value: "collect", label: "Collect payment" },
        ]}
      />
      <p className="text-sm text-muted">
        {choice === "free"
          ? "No payment needed. You can change this in Game settings."
          : choice === "collect"
            ? "You paid upfront. Player share will be calculated when players join. Public discovery waits for a player price."
            : "Payment is not set up. Public games stay out of Open games until a price is stated."}
      </p>
      <fieldset hidden={choice !== "collect"} className="min-w-0">
        <PaymentSetupFields
          defaults={defaults}
          bookingTotalCents={bookingTotalCents}
        />
      </fieldset>
    </fieldset>
  );
}
