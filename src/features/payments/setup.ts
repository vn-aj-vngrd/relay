import { z } from "zod";

const money = z.coerce
  .number()
  .min(0.01)
  .max(1_000_000)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
    "Use at most two decimal places."
  );
export const paymentAmountSchema = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce
    .number()
    .min(0)
    .max(1_000_000)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
      "Use at most two decimal places."
    )
);
export const expenseItemsSchema = z
  .array(
    z.object({
      label: z.string().trim().min(2).max(80),
      amountCents: z.number().int().positive().max(100_000_000),
    })
  )
  .min(1)
  .max(20)
  .refine(
    (items) =>
      items.reduce((sum, item) => sum + item.amountCents, 0) <= 100_000_000,
    "The expense total is too large."
  );

export const paymentSetupSchema = z
  .object({
    label: z.string().trim().min(2).max(80),
    total: money,
    method: z.string().trim().min(2).max(40),
    details: z.string().trim().min(2).max(300),
    contributionMode: z.enum(["split", "fixed"]).default("split"),
    fixedRate: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      money.optional()
    ),
    items: expenseItemsSchema.optional(),
  })
  .superRefine((setup, context) => {
    if (setup.contributionMode === "fixed" && setup.fixedRate === undefined)
      context.addIssue({
        code: "custom",
        path: ["fixedRate"],
        message: "Enter the fixed amount per player.",
      });
    if (
      setup.items &&
      setup.items.reduce((sum, item) => sum + item.amountCents, 0) !==
        Math.round(setup.total * 100)
    )
      context.addIssue({
        code: "custom",
        path: ["total"],
        message: "The total must match the expense breakdown.",
      });
  });

export function paymentSetupInput(data: FormData) {
  const rawItems = data.get("items");
  let items: unknown;
  if (typeof rawItems === "string" && rawItems) {
    try {
      items = JSON.parse(rawItems);
    } catch {
      items = null;
    }
  }
  return {
    ...Object.fromEntries(
      ["label", "total", "method", "details"].map((key) => [key, data.get(key)])
    ),
    contributionMode: data.get("contributionMode") ?? undefined,
    fixedRate: data.get("fixedRate") ?? undefined,
    items,
  };
}

export function collectionSetupValues(
  setup: z.output<typeof paymentSetupSchema>
) {
  return {
    totalCents: Math.round(setup.total * 100),
    contributionMode: setup.contributionMode,
    fixedRateCents:
      setup.contributionMode === "fixed"
        ? Math.round(setup.fixedRate! * 100)
        : null,
    items: setup.items ?? [
      { label: setup.label, amountCents: Math.round(setup.total * 100) },
    ],
  };
}

export function paymentBreakdownSummary(value: string | undefined) {
  try {
    const parsed = expenseItemsSchema.safeParse(JSON.parse(value ?? "null"));
    return parsed.success
      ? parsed.data
          .map(
            (item) => `${item.label}: ₱${(item.amountCents / 100).toFixed(2)}`
          )
          .join(" · ")
      : "";
  } catch {
    return "";
  }
}

export function paymentChoiceSummary(
  choice: string | undefined,
  mode?: string,
  rate?: string
) {
  if (choice === "free") return "Free · No payment needed";
  if (choice === "collect")
    return mode === "fixed"
      ? `Collect payment · ₱${rate ?? ""} per player (fixed)`
      : "Collect payment · Player share will be calculated when players join";
  return "Payment not set up yet";
}

export type PaymentFieldErrors = Record<string, string>;

export function paymentSetupValidationError(error: z.ZodError) {
  const fieldErrors: PaymentFieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    const key = path === "label" ? "items" : path;
    if (fieldErrors[key]) continue;
    fieldErrors[key] = key.endsWith(".label")
      ? "Enter an expense name with 2–80 characters."
      : key.endsWith(".amountCents")
        ? "Enter an amount from ₱0.01 to ₱1,000,000, with at most two decimal places."
        : key === "details"
          ? "Enter payment instructions with 2–300 characters."
          : key === "method"
            ? "Choose a payment method."
            : key === "fixedRate"
              ? "Enter a per-player amount from ₱0.01 to ₱1,000,000, with at most two decimal places."
              : key === "contributionMode"
                ? "Choose how players contribute."
                : key === "total"
                  ? "Check the expense amounts. The total must be between ₱0.01 and ₱1,000,000 and match the breakdown."
                  : "Check the expense breakdown. Add 1–20 expenses totaling no more than ₱1,000,000.";
  }
  return {
    error:
      "A few payment details need attention. Check the highlighted fields below.",
    fieldErrors,
  };
}

export const paymentChoiceSchema = z.enum(["unspecified", "free", "collect"]);

// Old browser drafts retain their editable setup instead of losing payment data.
export function hasSavedPaymentSetup(values: Record<string, string> = {}) {
  return ["total", "items", "fixedRate", "details"].some((key) =>
    Boolean(values[key])
  );
}

export function creationPaymentSummary(values: Record<string, string>) {
  if (values.costKind === "collect" && hasSavedPaymentSetup(values))
    return `${paymentChoiceSummary(values.costKind, values.contributionMode, values.fixedRate)} · ${values.label ?? "Game expenses"} · ${paymentBreakdownSummary(values.items) || "One expense"} · ₱${values.total} total · ${values.method} · ${values.details}`;
  const summary =
    values.costKind === "collect"
      ? "Collect payment · Set the price and instructions in Game settings after creation"
      : paymentChoiceSummary(values.costKind);
  return values.visibility === "public" && values.costKind !== "free"
    ? `${summary}. You can share your game immediately. It won’t appear in Open games until you set a player price.`
    : summary;
}

export function serializableCreationValues(data: FormData) {
  return Object.fromEntries(
    Array.from(data.entries()).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}
