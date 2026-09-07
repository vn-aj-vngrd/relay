import { z } from "zod";

export const paymentSetupSchema = z.object({
  label: z.string().trim().min(2).max(80),
  total: z.coerce.number().min(0.01).max(1_000_000),
  method: z.string().trim().min(2).max(40),
  details: z.string().trim().min(2).max(300),
});

export function paymentSetupInput(data: FormData) {
  return Object.fromEntries(
    ["label", "total", "method", "details"].map((key) => [key, data.get(key)])
  );
}

export function paymentChoiceSummary(choice: string | undefined) {
  if (choice === "free") return "Free · No payment needed";
  if (choice === "collect")
    return "Collect payment · Player share will be calculated when players join";
  return "Payment not set up yet";
}

export function serializableCreationValues(data: FormData) {
  return Object.fromEntries(
    Array.from(data.entries()).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}
