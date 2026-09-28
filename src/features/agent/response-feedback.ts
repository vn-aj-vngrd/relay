import { z } from "zod";

export const agentReplyRatings = ["good", "bad"] as const;
export type AgentReplyRating = (typeof agentReplyRatings)[number];

export const agentReplyReasons = {
  good: [
    { value: "answered", label: "Answered my question" },
    { value: "accurate", label: "Accurate game details" },
    { value: "clear", label: "Clear and easy to follow" },
    { value: "other", label: "Other" },
  ],
  bad: [
    { value: "incorrect", label: "Incorrect details" },
    { value: "missed", label: "Didn’t answer my question" },
    { value: "unclear", label: "Hard to follow" },
    { value: "privacy", label: "Privacy or safety concern" },
    { value: "other", label: "Other" },
  ],
} as const;

const reason = z.enum([
  "answered",
  "accurate",
  "clear",
  "incorrect",
  "missed",
  "unclear",
  "privacy",
  "other",
]);

export const agentReplyFeedbackSchema = z
  .object({
    conversationId: z.uuid(),
    messageId: z.string().min(1).max(120),
    rating: z.enum(agentReplyRatings),
    reasons: z.array(reason).max(5),
    details: z.string().trim().max(1000),
  })
  .strict()
  .superRefine((value, context) => {
    const allowed = new Set<string>(
      agentReplyReasons[value.rating].map((item) => item.value)
    );
    if (
      value.reasons.some((item) => !allowed.has(item)) ||
      new Set(value.reasons).size !== value.reasons.length
    )
      context.addIssue({
        code: "custom",
        path: ["reasons"],
        message: "Choose valid reasons for this rating.",
      });
    if (!value.reasons.length && value.details.length < 10)
      context.addIssue({
        code: "custom",
        path: ["details"],
        message: "Choose a reason or add a few details.",
      });
  });

export type AgentReplyFeedbackInput = z.infer<typeof agentReplyFeedbackSchema>;

export function agentReplyFeedbackDescription(input: AgentReplyFeedbackInput) {
  const labels = agentReplyReasons[input.rating]
    .filter((item) => input.reasons.includes(item.value))
    .map((item) => item.label);
  return [
    labels.length ? `Reasons: ${labels.join(", ")}` : null,
    input.details ? `Details: ${input.details}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
