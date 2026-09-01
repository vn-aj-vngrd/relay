import { z } from "zod";

export function parseAdminEmails(value: string) {
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const adminReasonSchema = z
  .string()
  .trim()
  .min(5, "Add a short reason (at least 5 characters).")
  .max(240, "Keep the reason under 240 characters.");
export const adminUserActionSchema = z.object({ userId: z.uuid(), reason: adminReasonSchema });
export const adminOnboardingResetSchema = z.object({ userId: z.uuid() });
export const adminPasswordResetSchema = z.object({ userId: z.uuid(), reason: adminReasonSchema });
export const adminSessionActionSchema = z.object({ sessionId: z.uuid(), reason: adminReasonSchema });
export const adminSignupCapacitySchema = z.object({
  accountCap: z.coerce
    .number()
    .int("Enter a whole number of accounts.")
    .min(1, "Allow at least one account.")
    .max(50_000, "Keep the account limit at 50,000 or fewer."),
});

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters.")
  .max(24, "Keep the username under 24 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.");

export const adminCreateUserSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email address."))
    .transform((value) => value.toLowerCase()),
  name: z.string().trim().min(2, "Enter the player’s name.").max(80),
  username: usernameSchema,
});

export const adminUpdateProfileSchema = z.object({
  userId: z.uuid(),
  name: z.string().trim().min(2, "Enter the player’s name.").max(80),
  username: usernameSchema,
  city: z.string().trim().max(80).optional(),
  skillLevel: z.enum(["", "new", "casual", "regular", "experienced"]),
  dominantHand: z.enum(["", "left", "right", "both"]),
});
