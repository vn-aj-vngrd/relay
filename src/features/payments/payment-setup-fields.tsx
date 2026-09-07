"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { expenseItemsSchema } from "./setup";

const input =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function initialItems(
  defaults: Record<string, string>,
  bookingTotalCents: number | null
) {
  try {
    const parsed = expenseItemsSchema.safeParse(
      JSON.parse(defaults.items ?? "null")
    );
    if (parsed.success)
      return parsed.data.map((item, index) => ({
        id: index,
        label: item.label,
        amount: String(item.amountCents / 100),
      }));
  } catch {
    /* A restored draft may predate expense breakdowns. */
  }
  return [
    {
      id: 0,
      label: defaults.label ?? "Court",
      amount:
        defaults.total ??
        (bookingTotalCents == null ? "" : String(bookingTotalCents / 100)),
    },
  ];
}

export function PaymentSetupFields({
  bookingTotalCents = null,
  defaults = {},
  totalReadOnly = false,
  contributionReadOnly = false,
}: {
  bookingTotalCents?: number | null;
  defaults?: Record<string, string>;
  totalReadOnly?: boolean;
  contributionReadOnly?: boolean;
}) {
  const id = useId();
  const [mode, setMode] = useState(defaults.contributionMode ?? "split");
  const [items, setItems] = useState(() =>
    initialItems(defaults, bookingTotalCents)
  );
  const nextId = useRef(items.length);
  const totalCents = items.reduce(
    (sum, item) => sum + Math.round(Number(item.amount) * 100),
    0
  );
  const total = Number.isFinite(totalCents) ? String(totalCents / 100) : "";
  function changeItem(
    itemId: number,
    field: "label" | "amount",
    value: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-semibold" htmlFor={`${id}-label`}>
          Collection name
        </label>
        <input
          className={input}
          id={`${id}-label`}
          name="label"
          maxLength={80}
          defaultValue={defaults.label ?? "Game expenses"}
          required
        />
      </div>
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">
          Expense breakdown
        </legend>
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(
            items.map((item) => ({
              label: item.label,
              amountCents: Math.round(Number(item.amount) * 100),
            }))
          )}
        />
        {items.map((item, index) => (
          <div key={item.id} className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 basis-40">
              <label htmlFor={`${id}-item-${item.id}`} className="text-sm">
                Expense {index + 1}
              </label>
              <input
                id={`${id}-item-${item.id}`}
                className={input}
                value={item.label}
                maxLength={80}
                required
                readOnly={totalReadOnly}
                onChange={(event) =>
                  changeItem(item.id, "label", event.target.value)
                }
              />
            </div>
            <div className="w-32">
              <label htmlFor={`${id}-cost-${item.id}`} className="text-sm">
                Amount (₱)
              </label>
              <input
                id={`${id}-cost-${item.id}`}
                className={`${input} score`}
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                inputMode="decimal"
                required
                readOnly={totalReadOnly}
                value={item.amount}
                onChange={(event) =>
                  changeItem(item.id, "amount", event.target.value)
                }
              />
            </div>
            {!totalReadOnly && items.length > 1 ? (
              <Button
                type="button"
                variant="quiet"
                aria-label={`Remove expense ${index + 1}`}
                onClick={() =>
                  setItems((current) =>
                    current.filter((row) => row.id !== item.id)
                  )
                }
              >
                Remove
              </Button>
            ) : null}
          </div>
        ))}
        {!totalReadOnly && items.length < 20 ? (
          <Button
            type="button"
            variant="secondary"
            className="self-start"
            onClick={() => {
              const itemId = nextId.current++;
              setItems((current) => [
                ...current,
                { id: itemId, label: "", amount: "" },
              ]);
            }}
          >
            Add expense
          </Button>
        ) : null}
      </fieldset>
      <div>
        <label className="text-sm font-semibold" htmlFor={`${id}-total`}>
          Total amount
        </label>
        <input
          className={`${input} score`}
          id={`${id}-total`}
          name="total"
          type="number"
          value={total}
          readOnly
        />
        <p className="mt-1.5 text-sm text-muted">
          Total of the expenses above.{" "}
          {bookingTotalCents != null
            ? "The first expense starts with the booking amount."
            : ""}
        </p>
      </div>
      {totalReadOnly || contributionReadOnly ? (
        <>
          <input type="hidden" name="contributionMode" value={mode} />
          <p className="text-sm font-semibold">
            {mode === "fixed" ? "Fixed amount per player" : "Split expenses"}
          </p>
        </>
      ) : (
        <SelectField
          id={`${id}-contribution`}
          name="contributionMode"
          label="How players contribute"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "split", label: "Split expenses" },
            { value: "fixed", label: "Fixed amount per player" },
          ]}
        />
      )}
      {mode === "fixed" ? (
        <div>
          <label className="text-sm font-semibold" htmlFor={`${id}-rate`}>
            Fixed amount per player (₱)
          </label>
          <input
            id={`${id}-rate`}
            name="fixedRate"
            className={`${input} score`}
            type="number"
            min="0.01"
            max="1000000"
            step="0.01"
            required
            inputMode="decimal"
            readOnly={totalReadOnly}
            defaultValue={defaults.fixedRate ?? ""}
          />
          <p className="mt-1.5 text-sm text-muted">
            This is the advertised price before players join. It stays fixed as
            the roster changes. Collections may be above or below your expenses;
            you cover any shortfall.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Automatic shares change with the roster until payment review begins.
          Discounts and waivers stay with that player, not redistributed to
          others. Public discovery waits until a player share is available.
        </p>
      )}
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
            ? "List your expenses and choose how players contribute. The host is excluded."
            : "Price not set. Public games stay out of Open games until a price is stated."}
      </p>
      <fieldset
        hidden={choice !== "collect"}
        disabled={choice !== "collect"}
        className="min-w-0"
      >
        <PaymentSetupFields
          defaults={defaults}
          bookingTotalCents={bookingTotalCents}
        />
      </fieldset>
    </fieldset>
  );
}
