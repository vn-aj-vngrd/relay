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
  expanded = false,
}: {
  bookingTotalCents?: number | null;
  defaults?: Record<string, string>;
  totalReadOnly?: boolean;
  contributionReadOnly?: boolean;
  expanded?: boolean;
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
    <div
      className={
        expanded
          ? "grid min-w-0 gap-8 md:grid-cols-2"
          : "flex min-w-0 flex-col gap-4"
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        <input
          type="hidden"
          name="label"
          value={defaults.label ?? "Game expenses"}
        />
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Expenses</legend>
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
                  value={item.amount}
                  onChange={(event) =>
                    changeItem(item.id, "amount", event.target.value)
                  }
                />
              </div>
              {items.length > 1 ? (
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
          {items.length < 20 ? (
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
        <div className="border-t border-line pt-4">
          <label className="text-sm font-semibold" htmlFor={`${id}-total`}>
            Total amount
          </label>
          <input
            className="score mt-2 h-9 w-full border-0 bg-transparent text-xl font-semibold outline-none"
            id={`${id}-total`}
            name="total"
            type="number"
            value={total}
            readOnly
          />
          {totalReadOnly ? (
            <p className="mt-2 text-sm text-muted" role="status">
              {Math.round(Number(total) * 100) !==
              Math.round(Number(defaults.total) * 100)
                ? `Keep the total at ₱${Number(defaults.total).toLocaleString("en-PH")} to save. Player shares are already assigned.`
                : "You can change the breakdown, but the agreed total must stay the same."}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        {totalReadOnly || contributionReadOnly ? (
          <>
            <input type="hidden" name="contributionMode" value={mode} />
            <div>
              <p className="text-sm font-semibold">Split type</p>
              <p className="mt-2 text-sm text-muted">
                {mode === "fixed" ? "Fixed amount per player" : "Split equally"}
              </p>
            </div>
          </>
        ) : (
          <SelectField
            id={`${id}-contribution`}
            name="contributionMode"
            label="Split type"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "split", label: "Split equally" },
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
              Same price for each player. You cover any shortfall.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Divided between players, excluding the host. Shares may change until
            payment review begins.
          </p>
        )}
        <fieldset className="mt-2 flex min-w-0 flex-col gap-4 border-t border-line pt-5">
          <legend className="sr-only">Payment details</legend>
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
        </fieldset>
      </div>
    </div>
  );
}

export function PlayerPaymentFields({
  defaults = {},
  bookingTotalCents = null,
  expanded = false,
}: {
  defaults?: Record<string, string>;
  bookingTotalCents?: number | null;
  expanded?: boolean;
}) {
  const [choice, setChoice] = useState(defaults.costKind ?? "unspecified");
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-2 text-sm font-semibold">Player payment</legend>
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
            ? "Add expenses, then choose how players split the total."
            : "Price not set. Public games stay out of Open games until a price is stated."}
      </p>
      <fieldset
        hidden={choice !== "collect"}
        disabled={choice !== "collect"}
        className="min-w-0"
      >
        <PaymentSetupFields
          expanded={expanded}
          defaults={defaults}
          bookingTotalCents={bookingTotalCents}
        />
      </fieldset>
    </fieldset>
  );
}
