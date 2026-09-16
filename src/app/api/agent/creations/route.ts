import { z } from "zod";
import { readAgentSettings } from "@/features/agent/config";
import { creationInputSchema } from "@/features/agent/creation-schema";
import {
  cancelCreation,
  confirmCreation,
  creationOptions,
  listCreationProposals,
  startCreationForm,
  updateCreationForm,
} from "@/features/agent/creation-service";
import { AgentHistoryError } from "@/features/agent/history";
import { withAgentHistory } from "@/features/agent/history-api";
import { readAgentJson } from "@/features/agent/request";

export const runtime = "nodejs";
export const maxDuration = 60;
export function GET(request: Request) {
  return withAgentHistory(
    request,
    async (userId) => {
      if (new URL(request.url).searchParams.get("options") === "true") {
        const { config } = await readAgentSettings();
        if (
          !config.enabled ||
          (!config.allowGameCreation && !config.allowGroupCreation)
        )
          throw new AgentHistoryError(
            403,
            "Creation is currently unavailable."
          );
        return creationOptions(userId, config.allowCourtSearch);
      }
      const id = z
        .uuid()
        .safeParse(new URL(request.url).searchParams.get("chat"));
      if (!id.success) throw new AgentHistoryError(400, "Choose a chat.");
      return { proposals: await listCreationProposals(userId, id.data) };
    },
    "Agent actions are temporarily unavailable. Reload action status before retrying."
  );
}
export function POST(request: Request) {
  return withAgentHistory(
    request,
    async (userId) => {
      const parsed = z
        .object({ id: z.uuid(), action: z.enum(["confirm", "cancel"]) })
        .strict()
        .safeParse(await readAgentJson(request, 1024));
      if (!parsed.success)
        throw new AgentHistoryError(400, "Invalid confirmation.");
      return parsed.data.action === "confirm"
        ? confirmCreation(userId, parsed.data.id)
        : cancelCreation(userId, parsed.data.id);
    },
    "Agent actions are temporarily unavailable. Reload action status before retrying."
  );
}

export function PUT(request: Request) {
  return withAgentHistory(
    request,
    async (userId) => {
      const parsed = z
        .discriminatedUnion("action", [
          z
            .object({
              action: z.literal("start"),
              conversationId: z.uuid(),
              input: creationInputSchema,
            })
            .strict(),
          z
            .object({
              action: z.enum(["save", "review"]),
              id: z.uuid(),
              requestId: z.uuid(),
              input: creationInputSchema,
            })
            .strict(),
        ])
        .safeParse(await readAgentJson(request, 16_384));
      if (!parsed.success)
        throw new AgentHistoryError(
          400,
          "Check the setup fields and try again."
        );
      const value = parsed.data;
      return value.action === "start"
        ? startCreationForm(userId, value.conversationId, value.input)
        : updateCreationForm(
            userId,
            value.id,
            value.input,
            value.action === "review",
            value.requestId
          );
    },
    "Couldn’t save the setup. Your answers are still here; try again."
  );
}
