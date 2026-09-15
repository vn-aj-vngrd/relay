export type SavedAgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  interrupted?: boolean;
  createdAt?: string;
};
export type AgentConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};
export type AgentConversation = AgentConversationSummary & {
  messages: SavedAgentMessage[];
  pending: boolean;
};
