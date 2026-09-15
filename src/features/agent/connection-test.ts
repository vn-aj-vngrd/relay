import "server-only";
import { isStepCount, streamText, tool } from "ai";
import { z } from "zod";
import { agentModel, connectionFailure } from "./provider";

/** Synthetic only: no application data, instructions, or user messages leave here. */
export async function probeAgentConnection(
  model: string,
  encryptedApiKey: string,
  requireZeroRetention = true
) {
  try {
    const result = streamText({
      model: agentModel(model, encryptedApiKey, requireZeroRetention),
      system:
        "Test the connection. Call connection_check once, then reply with Ready.",
      prompt: "Run the connection check.",
      tools: {
        connection_check: tool({
          description: "Verify synthetic tool calling.",
          inputSchema: z.object({}),
          execute: async () => ({ ok: true }),
        }),
      },
      stopWhen: isStepCount(2),
      maxOutputTokens: 1024,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(25_000),
      onError: () => {
        /* Provider errors may contain secrets. Never log them. */
      },
    });
    let toolWorked = false;
    let textReceived = false;
    for await (const part of result.fullStream) {
      if (part.type === "error")
        return { error: connectionFailure(part.error) };
      if (part.type === "abort")
        return {
          error:
            "The connection test timed out. Try again or choose a faster model.",
        };
      if (part.type === "tool-result" && part.toolName === "connection_check")
        toolWorked = true;
      if (part.type === "text-delta" && part.text.trim()) textReceived = true;
    }
    return toolWorked && textReceived
      ? {
          success:
            "Connection passed: the saved model supports streaming and tool calling with Agent's privacy settings.",
        }
      : {
          error:
            "The model did not complete both tool calling and a text response. Try another tool-capable model or check its output limits.",
        };
  } catch (error) {
    return { error: connectionFailure(error) };
  }
}
