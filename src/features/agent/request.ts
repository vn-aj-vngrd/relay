import { agentRequestSchema } from "./validation";

export async function readAgentRequest(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      // Covers 24 × 4,000 UTF-16 units, worst-case JSON escapes and framing.
      if (size > 600_000) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = agentRequestSchema.safeParse(
      JSON.parse(new TextDecoder().decode(bytes))
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
