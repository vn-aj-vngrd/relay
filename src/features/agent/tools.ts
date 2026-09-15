import "server-only";
import { type ToolSet, tool } from "ai";
import { z } from "zod";
import { readAgentCourt, searchAgentCourts } from "./courts";
import { agentHelpIndex, readAgentHelp, searchAgentHelp } from "./help";
import { readAgentGame, readAgentGroups, searchAgentGames } from "./reads";
import {
  type AgentConfig,
  agentCourtSearchSchema,
  gameSearchSchema,
} from "./validation";

export function createAgentTools(
  userId: string,
  config: AgentConfig,
  signal: AbortSignal
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
        "Read upcoming games: mine, hosting, joining (Going), attention (invitations/pending requests or host booking/roster/pending approvals), open or groups. Paginated; never imply truncated results are complete. Dates use Asia/Manila. Group results do not grant roster access. For a named group, resolve its ID with myGroups and pass groupId.",
      inputSchema: gameSearchSchema,
      execute: (input) => read(() => searchAgentGames(userId, input)),
    });
    tools.gameDetails = tool({
      description:
        "Read an authorized game's details and permitted roster, using its ID from a game result or user's game URL. Unavailable also means unauthorized; do not distinguish.",
      inputSchema: z.object({ id: z.uuid() }),
      execute: ({ id }) => read(() => readAgentGame(userId, id)),
    });
    tools.myGroups = tool({
      description:
        "List this user's groups and their role. Use searchGames scope groups for their upcoming games.",
      inputSchema: z.object({
        offset: z.number().int().min(0).max(200).default(0),
      }),
      execute: ({ offset }) => read(() => readAgentGroups(userId, offset)),
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
        "Search Help Center using a few keywords, not an entire question. All words must match. Try helpIndex if no matches.",
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
  return tools;
}
