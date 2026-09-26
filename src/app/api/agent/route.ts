import {
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  type UIMessageChunk,
} from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { readAgentSettings } from "@/features/agent/config";
import {
  AgentHistoryError,
  beginAgentTurn,
  finishAgentTurn,
  releaseUnstartedAgentTurn,
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
import {
  type AgentWork,
  finishWork,
  toolWorkStep,
} from "@/features/agent/work";
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
  const startedAt = performance.now();
  const timing = {
    setupMs: 0,
    firstTextMs: null as number | null,
    chargeMs: 0,
    generationMs: 0,
    saveMs: 0,
    modelSteps: 0,
    toolCalls: 0,
    toolMs: 0,
  };
  let reservation: { userId: string; id: string } | null = null;
  let savedTurn: {
    userId: string;
    conversationId: string;
    requestId: string;
  } | null = null;
  let unstartedTurn: {
    userId: string;
    conversationId: string;
    requestId: string;
  } | null = null;
  let answer = "";
  let interrupted = false;
  let charged = false;
  let work: AgentWork | undefined;
  async function saveTurn() {
    if (!savedTurn) return;
    const saveStartedAt = performance.now();
    await finishAgentTurn(
      savedTurn.userId,
      savedTurn.conversationId,
      savedTurn.requestId,
      answer,
      interrupted,
      work
    );
    timing.saveMs += performance.now() - saveStartedAt;
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
    const body = await readAgentRequest(request);
    if (!body) return failure(400, "Start a new chat or shorten your message.");
    const requestId = body.requestId ?? crypto.randomUUID();
    if (body.conversationId)
      unstartedTurn = {
        userId: user.id,
        conversationId: body.conversationId,
        requestId,
      };
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
      unstartedTurn = null;
    }
    const cancellation = new AbortController();
    const signal = AbortSignal.any([
      request.signal,
      cancellation.signal,
      AbortSignal.timeout(50_000),
    ]);
    const generationStartedAt = performance.now();
    timing.setupMs = generationStartedAt - startedAt;
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
    // Only authored activity labels cross this boundary, never raw tool data,
    // provider metadata or reasoning. Older clients retain text-only responses.
    work = {
      startedAt: Date.now(),
      status: "working",
      entries: [{ step: "reviewing", status: "running" }],
    };
    const activityStream =
      request.headers.get("x-relay-agent-stream") === "activity-v1";
    const toolEntries = new Map<string, number>();
    const toolStartedAt = new Map<string, number>();
    let cancelled = false;
    const stream = new ReadableStream<UIMessageChunk>({
      cancel() {
        cancelled = true;
        cancellation.abort();
      },
      async start(controller) {
        const emit = (chunk: UIMessageChunk) => {
          if (!cancelled) controller.enqueue(chunk);
        };
        const metadata = () => ({ work: structuredClone(work) });
        const update = () =>
          emit({ type: "message-metadata", messageMetadata: metadata() });
        const completePhase = () => {
          for (const entry of work!.entries) {
            if (
              (entry.step === "reviewing" || entry.step === "writing") &&
              entry.status === "running"
            )
              entry.status = "complete";
          }
        };
        emit({
          type: "start",
          messageId: `${requestId}-answer`,
          messageMetadata: metadata(),
        });
        emit({ type: "text-start", id: "answer" });
        try {
          let wrote = false;
          for await (const part of result.fullStream) {
            if (part.type === "start-step") timing.modelSteps++;

            if (part.type === "error" || part.type === "abort")
              throw new Error("Agent unavailable");
            if (part.type === "tool-call") {
              timing.toolCalls++;
              toolStartedAt.set(part.toolCallId, performance.now());
              const step = toolWorkStep(part.toolName);
              if (step && work!.entries.length < 30) {
                completePhase();
                toolEntries.set(part.toolCallId, work!.entries.length);
                work!.entries.push({ step, status: "running" });
                update();
              }
            }
            if (part.type === "tool-result" || part.type === "tool-error") {
              const toolStart = toolStartedAt.get(part.toolCallId);
              if (toolStart !== undefined) {
                timing.toolMs += performance.now() - toolStart;
                toolStartedAt.delete(part.toolCallId);
              }
              const index = toolEntries.get(part.toolCallId);
              if (index !== undefined) {
                const output = part.type === "tool-result" ? part.output : null;
                const unavailable =
                  output &&
                  typeof output === "object" &&
                  "unavailable" in output &&
                  output.unavailable === true;
                work!.entries[index].status =
                  part.type === "tool-error" || unavailable
                    ? "failed"
                    : "complete";
                update();
              }
            }
            if (
              part.type === "finish" &&
              part.finishReason === "length" &&
              wrote
            ) {
              const note =
                "\n\nThis answer reached its length limit. Ask a narrower follow-up for the remaining details.";
              answer += note;
              emit({ type: "text-delta", id: "answer", delta: note });
            }
            if (part.type === "text-delta" && part.text.length) {
              if (signal.aborted) throw new Error("Response stopped");
              if (!charged && !part.text.trim()) continue;
              if (!charged) {
                timing.firstTextMs = performance.now() - generationStartedAt;
                const chargeStartedAt = performance.now();
                await chargeAgentMessage(user.id, requestId);
                timing.chargeMs = performance.now() - chargeStartedAt;
                charged = true;
              }
              if (
                !work!.entries.some(
                  (entry) =>
                    entry.step === "writing" && entry.status === "running"
                )
              ) {
                completePhase();
                if (work!.entries.length < 32)
                  work!.entries.push({ step: "writing", status: "running" });
                update();
              }
              answer += part.text;
              emit({ type: "text-delta", id: "answer", delta: part.text });
              wrote = true;
            }
          }
          if (signal.aborted || !wrote) throw new Error("Response interrupted");
          timing.generationMs = performance.now() - generationStartedAt;
          work = finishWork(work!, "completed");
          await saveTurn();
          await release();
          emit({ type: "text-end", id: "answer" });
          emit({
            type: "finish",
            messageMetadata: {
              ...metadata(),
              createdAt: new Date().toISOString(),
            },
          });
          if (!cancelled) controller.close();
        } catch {
          timing.generationMs = performance.now() - generationStartedAt;
          interrupted = true;
          work = finishWork(
            work!,
            request.signal.aborted || cancelled ? "stopped" : "failed"
          );
          try {
            await saveTurn();
          } catch {
            /* No transcript or upstream diagnostics are logged. */
          }
          await release();
          update();
          emit({ type: "error", errorText: "Agent response interrupted" });
          if (!cancelled) controller.close();
        } finally {
          try {
            await saveTurn();
          } catch {
            /* The saved prompt remains; no raw transcript is logged. */
          }
          await release();
          if (process.env.AGENT_PERFORMANCE_LOGGING === "true") {
            // Fixed numeric fields only: never transcripts, IDs, tool inputs,
            // provider bodies, credentials, or model reasoning.
            console.info("[agent-performance]", {
              ...timing,
              totalMs: performance.now() - startedAt,
              interrupted,
            });
          }
        }
      },
    });
    const responseHeaders = {
      ...privateHeaders,
      "Server-Timing": `setup;dur=${timing.setupMs.toFixed(1)}`,
    };
    if (activityStream)
      return createUIMessageStreamResponse({
        stream,
        headers: responseHeaders,
      });
    return new Response(
      stream.pipeThrough(
        new TransformStream<UIMessageChunk, Uint8Array>({
          transform(chunk, controller) {
            if (chunk.type === "text-delta")
              controller.enqueue(new TextEncoder().encode(chunk.delta));
            if (chunk.type === "error") throw new Error(chunk.errorText);
          },
        })
      ),
      {
        headers: {
          ...responseHeaders,
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
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
  } finally {
    if (unstartedTurn)
      try {
        await releaseUnstartedAgentTurn(
          unstartedTurn.userId,
          unstartedTurn.conversationId,
          unstartedTurn.requestId
        );
      } catch {
        /* The short lease still expires if cleanup is unavailable. */
      }
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
