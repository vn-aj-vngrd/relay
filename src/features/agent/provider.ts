import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { decryptAgentKey } from "./credentials";

export function agentModel(
  model: string,
  encryptedApiKey: string,
  requireZeroRetention = true
) {
  return createOpenRouter({ apiKey: decryptAgentKey(encryptedApiKey) }).chat(
    model,
    {
      provider: {
        require_parameters: true,
        data_collection: requireZeroRetention ? "deny" : "allow",
        zdr: requireZeroRetention,
      },
    }
  );
}

export function connectionFailure(error: unknown): string {
  const status =
    error && typeof error === "object" && "statusCode" in error
      ? error.statusCode
      : undefined;
  const details = error && typeof error === "object" ? error : {};
  const message =
    "message" in details && typeof details.message === "string"
      ? details.message
      : "";
  const body =
    "responseBody" in details && typeof details.responseBody === "string"
      ? details.responseBody
      : "";
  // Classify in memory; never return upstream bodies or interpolate their text.
  if (/data policy|privacy|zero.?data|data.?retention/i.test(message + body))
    return "This model is valid, but OpenRouter cannot route it under the current privacy policy. Check the model's retention support and your OpenRouter privacy settings.";
  if (status === 401 || status === 403)
    return "OpenRouter rejected this key or model access. Check the key permissions and account settings.";
  if (status === 402)
    return "OpenRouter requires credits for this request. Check the account balance and key spending limit.";
  if (status === 404 || status === 400 || status === 422)
    return "OpenRouter rejected this model request. Check the model ID, available endpoints, supported tools and your OpenRouter account settings.";
  if (status === 429)
    return "OpenRouter is rate limiting this connection. Wait and retry, or check the account limits.";
  return "The connection test failed or timed out. Check model availability and OpenRouter account settings, then retry.";
}
