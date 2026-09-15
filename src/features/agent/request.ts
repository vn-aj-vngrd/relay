import { agentRequestSchema } from "./validation";

export async function readAgentJson(
  request: Request,
  maxBytes = 600_000
): Promise<unknown> {
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
      if (size > maxBytes) {
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
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function readAgentRequest(request: Request) {
  const parsed = agentRequestSchema.safeParse(await readAgentJson(request));
  return parsed.success ? parsed.data : null;
}
