import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AgentHistoryError } from "./history";

export const historyHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function withAgentHistory(
  request: Request,
  action: (userId: string) => Promise<unknown>,
  unavailableMessage = "Chat history is temporarily unavailable."
) {
  try {
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      throw new AgentHistoryError(403, "Request not allowed.");
    const user = await getCurrentUser();
    if (!user) throw new AgentHistoryError(401, "Sign in to view chats.");
    const account = await db.query.users.findFirst({
      columns: { suspendedAt: true },
      where: eq(users.id, user.id),
    });
    if (
      !account ||
      account.suspendedAt ||
      user.app_metadata.force_password_change === true
    )
      throw new AgentHistoryError(403, "Account access required.");
    const limit = await checkRateLimit(
      { scope: "agent-history", limit: 120, windowSeconds: 60 },
      `user:${user.id}`
    );
    if (!limit.allowed)
      throw new AgentHistoryError(429, "Too many requests. Try again shortly.");
    return Response.json(await action(user.id), { headers: historyHeaders });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof AgentHistoryError
            ? error.message
            : unavailableMessage,
      },
      {
        status: error instanceof AgentHistoryError ? error.status : 503,
        headers: historyHeaders,
      }
    );
  }
}
