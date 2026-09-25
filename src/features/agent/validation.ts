import { z } from "zod";
import { defaultAgentLimits } from "./allowance";
import { agentMessageMaxLength } from "./constants";

const messageAllowance = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).max(100_000)
);

export const agentConfigSchema = z.object({
  requireZeroRetention: z.boolean().default(true),
  freeMessages: messageAllowance.default(defaultAgentLimits.freeMessages),
  plusMessages: messageAllowance.default(defaultAgentLimits.plusMessages),
  proMessages: messageAllowance.default(defaultAgentLimits.proMessages),
  enabled: z.boolean(),
  model: z
    .string()
    .trim()
    .max(150)
    .regex(/^(?:[a-zA-Z0-9._-]+\/[a-zA-Z0-9._:-]+)?$/),
  instructions: z.string().trim().max(4000),
  allowGameData: z.boolean(),
  allowHelp: z.boolean(),
  allowCourtSearch: z.boolean().default(true),
  allowGameCreation: z.boolean().default(false),
  allowGroupCreation: z.boolean().default(false),
  maxOutputTokens: z.coerce.number().int().min(256).max(4000),
  requestsPerHour: z.coerce.number().int().min(1).max(120),
});
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export const defaultAgentConfig: AgentConfig = {
  requireZeroRetention: true,
  ...defaultAgentLimits,
  enabled: false,
  model: "",
  instructions: "",
  allowGameData: true,
  allowHelp: true,
  allowCourtSearch: true,
  allowGameCreation: false,
  allowGroupCreation: false,
  maxOutputTokens: 1200,
  requestsPerHour: 30,
};

export const agentCourtSearchSchema = z
  .object({
    query: z.string().trim().max(100).default(""),
    nearMe: z.boolean().default(false),
    offset: z.number().int().min(0).max(200).default(0),
  })
  .strict();
export type AgentCourtSearch = z.infer<typeof agentCourtSearchSchema>;

// Only text is accepted. Client-supplied tools, system messages, metadata and
// attachments never become model messages or evidence of authorization.
export const agentRequestSchema = z
  .object({
    requestId: z.uuid().optional(),
    conversationId: z.uuid().optional(),
    messageId: z.string().min(1).max(100).optional(),
    retry: z.boolean().optional(),
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(agentMessageMaxLength),
          })
          .strict()
      )
      .min(1)
      .max(24),
  })
  .strict()
  .refine((value) => value.messages.at(-1)?.role === "user")
  .refine((value) => !value.retry || Boolean(value.messageId));

export const gameSearchSchema = z
  .object({
    scope: z.enum([
      "mine",
      "hosting",
      "joining",
      "attention",
      "invitations",
      "open",
      "groups",
    ]),
    when: z
      .enum(["upcoming", "current", "past", "all", "drafts"])
      .default("upcoming"),
    status: z.enum(["published", "live", "completed", "cancelled"]).optional(),
    role: z.enum(["any", "player", "host", "cohost"]).default("any"),
    response: z
      .enum([
        "any",
        "invited",
        "going",
        "maybe",
        "pending",
        "waitlisted",
        "declined",
      ])
      .default("any"),
    includeCancelled: z.boolean().default(false),
    venue: z.string().max(300).default(""),
    query: z.string().max(100).default(""),
    groupId: z
      .uuid()
      .optional()
      .describe("Optional group ID from myGroups; does not grant access"),
    from: z.iso
      .date()
      .optional()
      .describe("Inclusive date in Asia/Manila, YYYY-MM-DD"),
    until: z.iso
      .date()
      .optional()
      .describe("Inclusive date in Asia/Manila, YYYY-MM-DD"),
    offset: z.number().int().min(0).max(200).default(0),
  })
  .refine((value) => !value.from || !value.until || value.from <= value.until);
export type GameSearch = z.infer<typeof gameSearchSchema>;
