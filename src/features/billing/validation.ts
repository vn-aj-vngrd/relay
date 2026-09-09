import { z } from "zod";

import { billingProviders } from "./domain";

export const reasonSchema = z
  .string()
  .trim()
  .min(3, "Explain this change in at least 3 characters.")
  .max(600);
export const methodSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  provider: z.enum(billingProviders),
  recipient: z.string().trim().min(2).max(120),
  account: z.string().trim().min(3).max(120),
  instructions: z.string().trim().min(3).max(1200),
  enabled: z.boolean(),
  reason: reasonSchema,
});
export const settingsSchema = z.object({
  acceptingPayments: z.boolean(),
  supportContact: z.string().trim().min(3).max(240),
  reviewTime: z.string().trim().min(3).max(240),
  policy: z
    .string()
    .trim()
    .min(
      20,
      "Provide the refund, dispute and media-retention policy before accepting payments."
    )
    .max(4000),
  reason: reasonSchema,
});
export const reviewSchema = z
  .object({
    id: z.uuid(),
    decision: z.enum(["approved", "rejected", "clarification"]),
    reason: reasonSchema,
    verified: z.boolean(),
    verifiedReference: z.string().trim().max(120),
  })
  .superRefine((value, ctx) => {
    if (
      value.decision === "approved" &&
      (!value.verified || value.verifiedReference.length < 3)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["verified"],
        message:
          "Verify the received funds and enter the actual transaction reference before approval.",
      });
    }
  });
const nullableInteger = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().int().min(0).max(max).nullable()
  );
export const overrideSchema = z.object({
  userId: z.uuid(),
  games: nullableInteger(100_000),
  storageMiB: nullableInteger(1024 * 1024),
  expiresAt: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.date().nullable()
  ),
  reason: reasonSchema,
});
