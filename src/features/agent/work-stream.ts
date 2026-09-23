import { createUIMessageStreamResponse, type UIMessageChunk } from "ai";

// Keep cached text-only servers compatible during rollout. Activity-aware
// responses already use the SDK protocol and pass through unchanged.
export function ensureAgentUIStream(response: Response) {
  if (
    response.headers.get("content-type")?.includes("text/event-stream") ||
    !response.body
  )
    return response;
  const stream = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(
    new TransformStream<string, UIMessageChunk>({
      start(controller) {
        controller.enqueue({ type: "start" });
        controller.enqueue({ type: "text-start", id: "answer" });
      },
      transform(delta, controller) {
        controller.enqueue({ type: "text-delta", id: "answer", delta });
      },
      flush(controller) {
        controller.enqueue({ type: "text-end", id: "answer" });
        controller.enqueue({ type: "finish" });
      },
    })
  );
  return createUIMessageStreamResponse({ stream });
}
