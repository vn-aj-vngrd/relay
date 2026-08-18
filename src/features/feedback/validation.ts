import { z } from "zod";

import { feedbackAreas, feedbackStatuses, feedbackTypes } from "./domain";

const optionalPagePath = z
  .string()
  .trim()
  .max(300)
  .refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")), "Use a Relay page path.")
  .transform((value) => value || undefined);

export const submitFeedbackSchema = z.object({
  type: z.enum(feedbackTypes),
  area: z.enum(feedbackAreas),
  title: z.string().trim().min(5, "Add a short, specific title.").max(100, "Keep the title under 100 characters."),
  description: z
    .string()
    .trim()
    .min(15, "Add a little more detail so we can understand the request.")
    .max(3000, "Keep the description under 3,000 characters."),
  pagePath: optionalPagePath,
  contactAllowed: z.boolean(),
});

export const updateFeedbackSchema = z.object({
  feedbackId: z.uuid(),
  status: z.enum(feedbackStatuses),
  adminNote: z.string().trim().max(2000, "Keep the internal note under 2,000 characters."),
});
