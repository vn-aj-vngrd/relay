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

export function serializableCreationValues(data: FormData) {
  return Object.fromEntries(
    Array.from(data.entries()).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}
