import { AgentHistoryCollection } from "@/features/agent/history-collection";
import { requireUser } from "@/features/auth/session";

export const metadata = { title: "Chat history" };
export default async function AgentHistoryPage() {
  await requireUser("/agent/history");
  return <AgentHistoryCollection />;
}
