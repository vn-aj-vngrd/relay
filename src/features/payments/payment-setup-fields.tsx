"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { expenseItemsSchema, type PaymentFieldErrors } from "./setup";

function paymentInputClass(error?: string) {
  return `mt-1.5 h-11 w-full rounded-lg border bg-surface px-3 text-sm focus:outline-none focus:ring-2 ${error ? "border-danger focus:border-danger focus:ring-danger/15" : "border-line focus:border-primary focus:ring-primary/15"}`;
}

function PaymentFieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

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
  fieldErrors,
}: {
  bookingTotalCents?: number | null;
  defaults?: Record<string, string>;
  totalReadOnly?: boolean;
  contributionReadOnly?: boolean;
  expanded?: boolean;
  fieldErrors?: PaymentFieldErrors;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState<{
    source?: PaymentFieldErrors;
    keys: string[];
  }>({ keys: [] });
  const error = (key: string) =>
    dismissed.source === fieldErrors && dismissed.keys.includes(key)
      ? undefined
      : fieldErrors?.[key];
  function clearErrors(...keys: string[]) {
    setDismissed((current) => ({
      source: fieldErrors,
      keys: [...(current.source === fieldErrors ? current.keys : []), ...keys],
    }));
  }
  const errorId = (key: string) => `${id}-${key}-error`;
  const validation = (key: string) => ({
    "aria-invalid": Boolean(error(key)),
    "aria-describedby": error(key) ? errorId(key) : undefined,
    "data-payment-field": key,
  });
  useEffect(() => {
    if (!fieldErrors) return;
    const frame = requestAnimationFrame(() => {
      root.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [fieldErrors]);
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
      ref={root}
      onChangeCapture={(event) => {
        const target = event.target as HTMLElement;
        const key = target.dataset.paymentField;
        if (key)
          clearErrors(
            key,
            ...(key.startsWith("items.") ? ["total", "items"] : [])
          );
      }}
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
        <fieldset
          className="flex min-w-0 flex-col gap-3"
          tabIndex={error("items") ? -1 : undefined}
          {...validation("items")}
        >
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
            <div key={item.id} className="flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-1 basis-40">
                <label htmlFor={`${id}-item-${item.id}`} className="text-sm">
                  Expense {index + 1}
                </label>
                <input
                  id={`${id}-item-${item.id}`}
                  className={paymentInputClass(error(`items.${index}.label`))}
                  {...validation(`items.${index}.label`)}
                  value={item.label}
                  maxLength={80}
                  required
                  onChange={(event) =>
                    changeItem(item.id, "label", event.target.value)
                  }
                />
                <PaymentFieldError
                  id={errorId(`items.${index}.label`)}
                  message={error(`items.${index}.label`)}
                />
              </div>
              <div className="w-32">
                <label htmlFor={`${id}-cost-${item.id}`} className="text-sm">
                  Amount (₱)
                </label>
                <input
                  id={`${id}-cost-${item.id}`}
                  className={`${paymentInputClass(error(`items.${index}.amountCents`))} score`}
                  {...validation(`items.${index}.amountCents`)}
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
                <PaymentFieldError
                  id={errorId(`items.${index}.amountCents`)}
                  message={error(`items.${index}.amountCents`)}
                />
              </div>
              {items.length > 1 ? (
                <Button
                  type="button"
                  variant="quiet"
                  aria-label={`Remove expense ${index + 1}`}
                  className="mt-6"
                  onClick={() => {
                    clearErrors(
                      ...Object.keys(fieldErrors ?? {}).filter((key) =>
                        key.startsWith("items")
                      ),
                      "total"
                    );
                    setItems((current) =>
                      current.filter((row) => row.id !== item.id)
                    );
                  }}
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
                clearErrors("items", "total");
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
          <PaymentFieldError id={errorId("items")} message={error("items")} />
        </fieldset>
        <div className="border-t border-line pt-4">
          <label className="text-sm font-semibold" htmlFor={`${id}-total`}>
            Total amount
          </label>
          <input
            className={`score mt-2 h-9 w-full bg-transparent text-xl font-semibold outline-none ${error("total") ? "rounded-lg border border-danger" : "border-0"}`}
            {...validation("total")}
            id={`${id}-total`}
            name="total"
            type="number"
            value={total}
            readOnly
          />
          <PaymentFieldError id={errorId("total")} message={error("total")} />
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
            onValueChange={(value) => {
              setMode(value);
              clearErrors("contributionMode", "fixedRate");
            }}
            error={error("contributionMode")}
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
              className={`${paymentInputClass(error("fixedRate"))} score`}
              {...validation("fixedRate")}
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              required
              inputMode="decimal"
              readOnly={totalReadOnly}
              defaultValue={defaults.fixedRate ?? ""}
            />
            <PaymentFieldError
              id={errorId("fixedRate")}
              message={error("fixedRate")}
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
            error={error("method")}
            onValueChange={() => clearErrors("method")}
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
              className={`${paymentInputClass(error("details"))} min-h-24 py-3.5`}
              {...validation("details")}
              id={`${id}-details`}
              name="details"
              defaultValue={defaults.details ?? ""}
              maxLength={300}
              required
              autoComplete="off"
              placeholder="Account name and number…"
            />
            <PaymentFieldError
              id={errorId("details")}
              message={error("details")}
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
  choiceOnly = false,
  isPublic = false,
  fieldErrors,
  allowDecideLater = true,
  allowCollect = true,
  onChoiceChange,
}: {
  defaults?: Record<string, string>;
  bookingTotalCents?: number | null;
  expanded?: boolean;
  choiceOnly?: boolean;
  isPublic?: boolean;
  fieldErrors?: PaymentFieldErrors;
  allowDecideLater?: boolean;
  allowCollect?: boolean;
  onChoiceChange?: (value: string) => void;
}) {
  const [choice, setChoice] = useState(defaults.costKind ?? "unspecified");
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="sr-only">Player payment</legend>
      <SelectField
        id="costKind"
        name="costKind"
        label="Payment choice"
        value={choice}
        onValueChange={(value) => {
          setChoice(value);
          onChoiceChange?.(value);
        }}
        options={[
          ...(allowDecideLater
            ? [{ value: "unspecified", label: "Decide later" }]
            : []),
          { value: "free", label: "Free" },
          ...(allowCollect
            ? [{ value: "collect", label: "Collect payment" }]
            : []),
        ]}
      />
      <p className="text-sm text-muted">
        {choice === "free"
          ? "Players won’t need to pay. You can change this in Game settings."
          : choice === "collect"
            ? choiceOnly
              ? "Set the price and payment instructions in Game settings after creating your game."
              : "Add expenses, then choose how players split the total."
            : "Set this up later in Game settings."}
      </p>
      {isPublic && choice !== "free" ? (
        <p className="text-sm text-muted">
          You can share your game immediately. It won’t appear in Open games
          until you set a player price.
        </p>
      ) : null}
      {!choiceOnly ? (
        <fieldset
          hidden={choice !== "collect"}
          disabled={choice !== "collect"}
          className="min-w-0"
        >
          <PaymentSetupFields
            expanded={expanded}
            fieldErrors={choice === "collect" ? fieldErrors : undefined}
            defaults={defaults}
            bookingTotalCents={bookingTotalCents}
          />
        </fieldset>
      ) : null}
    </fieldset>
  );
}
