import "server-only";
import { type ToolSet, tool } from "ai";
import { z } from "zod";
import { groupFiltersSchema } from "@/features/groups/filters";
import { readAgentCourt, searchAgentCourts } from "./courts";
import { creationPreparationSchema } from "./creation-schema";
import { readAgentGameSection } from "./game-sections";
import { agentHelpIndex, readAgentHelp, searchAgentHelp } from "./help";
import {
  readAgentGame,
  readAgentGroup,
  readAgentGroups,
  searchAgentGames,
} from "./reads";
import {
  type AgentConfig,
  agentCourtSearchSchema,
  gameSearchSchema,
} from "./validation";

export function createAgentTools(
  userId: string,
  config: AgentConfig,
  signal: AbortSignal,
  context?: { conversationId: string; messageId: string; requestId: string }
) {
  let calls = 0;
  async function read<T>(operation: () => Promise<T> | T) {
    if (signal.aborted || ++calls > 12)
      return {
        unavailable: true,
        reason: "Read limit reached. Narrow the question.",
      };
    try {
      return await operation();
    } catch {
      return {
        unavailable: true,
        reason: "Could not read this information. Try again.",
      };
    }
  }
  const tools: ToolSet = {};
  if (config.allowGameData) {
    tools.searchGames = tool({
      description:
        "Read games across upcoming, current, past, all or drafts with when; narrow by status, role, response, venue or dates. Mine matches My Games; invitations includes invitation history (response invited selects unanswered upcoming invitations); hosting, joining (Going), attention, open and groups are separate scopes. Drafts require hosting or group-owner access. Open keeps the UI public discovery rules and does not expose public history. Paginated; never imply truncated results are complete. Dates use Asia/Manila. Group results do not grant roster access. For a named group, resolve its ID with myGroups and pass groupId.",
      inputSchema: gameSearchSchema,
      execute: (input) => read(() => searchAgentGames(userId, input)),
    });
    tools.gameDetails = tool({
      description:
        "Read an authorized game's overview, lifecycle, booking state, play settings, own RSVP and permitted roster, using its ID from a game result or user's game URL. Unavailable also means unauthorized; do not distinguish.",
      inputSchema: z.object({ id: z.uuid() }),
      execute: ({ id }) => read(() => readAgentGame(userId, id)),
    });
    tools.myGroups = tool({
      description:
        "Search this user's group list by name and owner/member role. Read groupDetails for description and members; use searchGames scope groups with groupId and when for current, upcoming or past group games.",
      inputSchema: groupFiltersSchema.extend({
        offset: z.number().int().min(0).max(200).default(0),
      }),
      execute: ({ offset, ...filters }) =>
        read(() => readAgentGroups(userId, offset, filters)),
    });
    tools.groupDetails = tool({
      description:
        "Read a group you belong to: description, your role and paginated member names/roles. Use its UUID or slug from myGroups or the user's group URL. This does not grant access to private game details.",
      inputSchema: z.object({
        reference: z.string().trim().min(1).max(200),
        offset: z.number().int().min(0).max(200).default(0),
      }),
      execute: ({ reference, offset }) =>
        read(() => readAgentGroup(userId, reference, offset)),
    });
    tools.gameSection = tool({
      description:
        "Explore an authorized game's UI information: play (courts, live scores, queue, results and standings), recap (recorded match totals and highlights), payments (organizers see player payments; other participants see only their own), chat (latest first), or story (photo captions). Paginate each returned collection with nextOffset. Amounts are cents; never infer money was transferred. No payment credentials, proofs, photos or device-local Quick Play are sent. Read only, no actions.",
      inputSchema: z.object({
        id: z.uuid(),
        section: z.enum(["play", "recap", "payments", "chat", "story"]),
        offset: z.number().int().min(0).max(200).default(0),
      }),
      execute: ({ id, section, offset }) =>
        read(() => readAgentGameSection(userId, id, section, offset)),
    });
  }
  if (config.allowCourtSearch) {
    tools.searchCourts = tool({
      description:
        "Search Relay's verified Court Finder directory by court name, city or neighborhood. Use concise name/address keywords (for example Cebu City). For near me without a named place, set nearMe and ask the user which city or neighborhood. No device location is available. Results include public and restricted facilities with access/status labels, not live bookable slots. Paginate using nextOffset.",
      inputSchema: agentCourtSearchSchema,
      execute: (input) => read(() => searchAgentCourts(input)),
    });
    tools.courtDetails = tool({
      description:
        "Read a listed court's hours, price, facilities, access, contact and status using its slug from searchCourts or a Relay court URL. No booking actions.",
      inputSchema: z.object({
        slug: z
          .string()
          .min(1)
          .max(150)
          .regex(/^[a-zA-Z0-9_-]+$/),
      }),
      execute: ({ slug }) => read(() => readAgentCourt(slug)),
    });
  }
  if (config.allowHelp) {
    tools.helpIndex = tool({
      description:
        "List Help Center article titles/slugs to find an appropriate guide.",
      inputSchema: z.object({}),
      execute: () => read(agentHelpIndex),
    });
    tools.searchHelp = tool({
      description:
        "Search Help Center using a few keywords, not an entire question. All words must match. A clear first match includes its authoritative article; use it directly if relevant. Read other matching guides with readHelp. Try helpIndex if no matches.",
      inputSchema: z.object({ query: z.string().max(100) }),
      execute: ({ query }) => read(() => searchAgentHelp(query)),
    });
    tools.readHelp = tool({
      description:
        "Read the authoritative Help Center guide before explaining how Relay works. Never reveal internal source file paths.",
      inputSchema: z.object({ slug: z.string().max(100) }),
      execute: ({ slug }) => read(() => readAgentHelp(slug)),
    });
  }
  if (context && (config.allowGameCreation || config.allowGroupCreation)) {
    tools.creationOptions = tool({
      description:
        "Read accessible groups, owned games, and enabled court suggestions for creation. Lists are bounded. If the requested group is absent, ask for its Relay group link and resolve its exact slug or UUID with groupReference, even when general game reads are disabled. Resolve a verified court outside the suggestions using its exact Relay slug or UUID as courtReference; court search must be enabled. Replay only completed games; save a crew only from an owned completed game without a group.",
      inputSchema: z.object({
        groupReference: z.string().trim().min(1).max(200).optional(),
        courtReference: z.string().trim().min(1).max(200).optional(),
      }),
      execute: ({ groupReference, courtReference }) =>
        read(async () =>
          (await import("./creation-service")).creationOptions(
            userId,
            config.allowCourtSearch,
            groupReference,
            courtReference
          )
        ),
    });
    tools.creationStatus = tool({
      description:
        "Read trusted pending or completed creation status for this chat. Only a completed result proves an action happened. Never infer success from prior assistant text.",
      inputSchema: z.object({}),
      execute: () =>
        read(async () =>
          (
            await (
              await import("./creation-service")
            ).listCreationProposals(userId, context.conversationId)
          ).map(({ status, destination, preview, input }) => ({
            status,
            destination,
            input,
            title: preview.title,
            details: preview.lines,
          }))
        ),
    });
    tools.prepareCreation = tool({
      description:
        "Prepare a game, group, or browser-local Quick Play through chat. Call as soon as the kind is known, including only supplied details or supported source defaults. Before each continuation, read creationStatus and merge the saved answers with new details. Ask exactly one missing question per response; never a numbered questionnaire or a form/panel. Complete drafts produce a final review card requiring an explicit approval button; no text reply can execute creation. Set flow for draft, replay, groupGame, or crew when appropriate. Send known corrected details for edits. This does not execute a creation. Only the user can confirm the preview. Hosted game and Quick Play require game creation enabled; groups require group creation enabled.",
      inputSchema: creationPreparationSchema.safeExtend({
        interactionMode: z.literal("chat").optional(),
      }),
      execute: (input) =>
        read(async () => {
          try {
            return await (await import("./creation-service")).prepareCreation(
              userId,
              context.conversationId,
              context.messageId,
              context.requestId,
              input
            );
          } catch (error) {
            if (error instanceof (await import("./history")).AgentHistoryError)
              return { status: "needs_input", message: error.message };
            throw error;
          }
        }),
    });
  }
  return tools;
}
