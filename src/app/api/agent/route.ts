import { isStepCount, streamText } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { readAgentSettings } from "@/features/agent/config";
import {
  AgentHistoryError,
  beginAgentTurn,
  finishAgentTurn,
} from "@/features/agent/history";
import { agentInstructions } from "@/features/agent/instructions";
import { agentModel } from "@/features/agent/provider";
import { readAgentRequest } from "@/features/agent/request";
import { createAgentTools } from "@/features/agent/tools";
import {
  AgentDuplicateRequestError,
  AgentQuotaError,
  chargeAgentMessage,
  getAgentUsage,
  releaseAgentMessage,
  reserveAgentMessage,
} from "@/features/agent/usage";
import { getCurrentUser } from "@/features/auth/session";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
function failure(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: privateHeaders });
}

export async function POST(request: Request) {
  let reservation: { userId: string; id: string } | null = null;
  let savedTurn: {
    userId: string;
    conversationId: string;
    requestId: string;
  } | null = null;
  let answer = "";
  let interrupted = false;
  let charged = false;
  async function saveTurn() {
    if (!savedTurn) return;
    await finishAgentTurn(
      savedTurn.userId,
      savedTurn.conversationId,
      savedTurn.requestId,
      answer,
      interrupted
    );
    savedTurn = null;
  }
  let released = false;
  async function release() {
    if (reservation && !charged && !released) {
      try {
        await releaseAgentMessage(reservation.userId, reservation.id);
        released = true;
      } catch {
        /* Expiring reservations recover abandoned or failed attempts. */
      }
    }
  }
  try {
    const origin = new URL(request.url).origin;
    if (request.headers.get("origin") !== origin)
      return failure(403, "Request not allowed.");
    const user = await getCurrentUser();
    if (!user) return failure(401, "Sign in to use Agent.");
    const account = await db.query.users.findFirst({
      columns: { suspendedAt: true },
      where: eq(users.id, user.id),
    });
    if (
      !account ||
      account.suspendedAt ||
      user.app_metadata.force_password_change === true
    )
      return failure(403, "Account access required.");
    const { config, encryptedApiKey } = await readAgentSettings();
    if (!config.enabled || !encryptedApiKey || !config.model)
      return failure(503, "Agent is not available yet.");
    const limit = await checkRateLimit(
      {
        scope: "agent-chat",
        limit: config.requestsPerHour,
        windowSeconds: 3600,
      },
      `user:${user.id}`
    );
    if (!limit.allowed)
      return Response.json(
        { error: "Agent's hourly limit has been reached. Try again later." },
        {
          status: 429,
          headers: { ...privateHeaders, ...rateLimitHeaders(limit) },
        }
      );
    const body = await readAgentRequest(request);
    if (!body) return failure(400, "Start a new chat or shorten your message.");
    const requestId = body.requestId ?? crypto.randomUUID();
    await reserveAgentMessage(user.id, requestId, config);
    reservation = { userId: user.id, id: requestId };
    let modelMessages = body.messages;
    if (body.conversationId) {
      modelMessages = await beginAgentTurn(
        user.id,
        body.conversationId,
        requestId,
        body.messages.at(-1)!.content,
        { messageId: body.messageId, retry: body.retry ?? false }
      );
      savedTurn = {
        userId: user.id,
        conversationId: body.conversationId,
        requestId,
      };
    }
    const cancellation = new AbortController();
    const signal = AbortSignal.any([
      request.signal,
      cancellation.signal,
      AbortSignal.timeout(50_000),
    ]);
    const result = streamText({
      model: agentModel(
        config.model,
        encryptedApiKey,
        config.requireZeroRetention
      ),
      system: agentInstructions(config.instructions, new Date(), config),
      messages: modelMessages,
      tools: createAgentTools(
        user.id,
        config,
        signal,
        body.conversationId && body.messageId
          ? {
              conversationId: body.conversationId,
              messageId: body.messageId,
              requestId,
            }
          : undefined
      ),
      stopWhen: isStepCount(6),
      prepareStep: ({ stepNumber }) => ({
        // Omit tools entirely on the answer step; some endpoints reject tool_choice: none.
        activeTools: stepNumber >= 5 ? [] : undefined,
      }),
      maxOutputTokens: config.maxOutputTokens,
      maxRetries: 0,
      abortSignal: signal,
      onError: () => {
        /* Provider errors can contain request bodies. Never log them. */
      },
    });
    // Text-only transport: reasoning, tool payloads and provider metadata never
    // cross the client boundary. Fixed error copy prevents upstream disclosure.
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      cancel() {
        cancellation.abort();
      },
      async start(controller) {
        try {
          let wrote = false;
          for await (const part of result.fullStream) {
            if (part.type === "error" || part.type === "abort")
              throw new Error("Agent unavailable");
            if (
              part.type === "finish" &&
              part.finishReason === "length" &&
              wrote
            ) {
              const note =
                "\n\nThis answer reached its length limit. Ask a narrower follow-up for the remaining details.";
              answer += note;
              controller.enqueue(encoder.encode(note));
            }
            if (part.type === "text-delta" && part.text.length) {
              if (signal.aborted) throw new Error("Response stopped");
              if (!charged && !part.text.trim()) continue;
              if (!charged) {
                await chargeAgentMessage(user.id, requestId);
                charged = true;
              }
              answer += part.text;
              controller.enqueue(encoder.encode(part.text));
              wrote = true;
            }
          }
          if (!wrote && !signal.aborted) throw new Error("Empty response");
          await saveTurn();
          await release();
          controller.close();
        } catch {
          interrupted = true;
          try {
            await saveTurn();
          } catch {
            /* Fixed public error below; no transcript logging. */
          }
          await release();
          // A failed stream becomes a client error, never a fabricated assistant turn.
          controller.error(new Error("Agent response interrupted"));
        } finally {
          try {
            await saveTurn();
          } catch {
            /* The saved prompt remains; no raw transcript is logged. */
          }
          await release();
        }
      },
    });
    return new Response(stream, {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    interrupted = true;
    try {
      await saveTurn();
    } catch {
      /* Never log transcript storage errors. */
    }
    await release();
    if (error instanceof AgentHistoryError)
      return failure(error.status, error.message);
    if (error instanceof AgentQuotaError)
      return failure(
        402,
        "No Agent messages are currently available. Pending answers may still reserve messages. Check Plan & billing for your usage and options."
      );
    if (error instanceof AgentDuplicateRequestError)
      return failure(
        409,
        "This request was already received. Send a new message to try again."
      );
    return failure(503, "Agent is temporarily unavailable. Try again later.");
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return failure(401, "Sign in to use Agent.");
    const account = await db.query.users.findFirst({
      columns: { suspendedAt: true },
      where: eq(users.id, user.id),
    });
    if (
      !account ||
      account.suspendedAt ||
      user.app_metadata.force_password_change === true
    )
      return failure(403, "Account access required.");
    const { config } = await readAgentSettings();
    return Response.json(await getAgentUsage(user.id, config), {
      headers: privateHeaders,
    });
  } catch {
    return failure(503, "Agent usage is temporarily unavailable.");
  }
}
