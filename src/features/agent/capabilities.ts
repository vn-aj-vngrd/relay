export type AgentCapabilities = {
  allowGameData: boolean;
  allowCourtSearch: boolean;
  allowHelp: boolean;
  allowGameCreation: boolean;
  allowGroupCreation: boolean;
};
export const agentCapabilityPrompts = [
  {
    label: "Create a game",
    flow: "game",
    prompt: "Help me create a game.",
    capability: "allowGameCreation",
    category: "Create",
  },
  {
    label: "Start Quick Play",
    flow: "quickPlay",
    prompt: "Help me set up local Quick Play.",
    capability: "allowGameCreation",
    category: "Create",
  },
  {
    label: "Save a game draft",
    flow: "draft",
    prompt: "Help me prepare a game and save it as a draft.",
    capability: "allowGameCreation",
    category: "Create",
  },
  {
    label: "Replay a game",
    flow: "replay",
    prompt: "Help me replay one of my completed games.",
    capability: "allowGameCreation",
    category: "Create",
  },
  {
    label: "Create a group game",
    flow: "groupGame",
    prompt: "Help me create a game for my group.",
    capability: "allowGameCreation",
    category: "Create",
  },
  {
    label: "Create a group",
    flow: "group",
    prompt: "Help me create a group.",
    capability: "allowGroupCreation",
    category: "Create",
  },
  {
    label: "Save a game's crew",
    flow: "crew",
    prompt: "Help me save a game's crew as a group.",
    capability: "allowGroupCreation",
    category: "Create",
  },
  {
    label: "Find my next game",
    prompt: "When is my next game?",
    capability: "allowGameData",
    category: "Explore",
  },
  {
    label: "Games needing attention",
    prompt: "What games need my attention?",
    capability: "allowGameData",
    category: "Explore",
  },
  {
    label: "Browse open games",
    prompt: "Show open games tomorrow.",
    capability: "allowGameData",
    category: "Explore",
  },
  {
    label: "My groups and players",
    prompt: "Show my groups and help me find who's joining my next game.",
    capability: "allowGameData",
    category: "Explore",
  },
  {
    label: "Find courts near me",
    prompt: "Find courts near me.",
    capability: "allowCourtSearch",
    category: "Explore",
  },
  {
    label: "Learn how Relay works",
    prompt: "Help me learn how to use Relay.",
    capability: "allowHelp",
    category: "Explore",
  },
] as const;
export function availableAgentPrompts(capabilities: AgentCapabilities) {
  return agentCapabilityPrompts.filter((item) => capabilities[item.capability]);
}
