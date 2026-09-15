import "server-only";
import { z } from "zod";

const catalogSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string().max(150),
        name: z.string().max(200),
        supported_parameters: z.array(z.string()).optional(),
      })
    )
    .max(5000),
});

export async function getAgentModels() {
  try {
    // Public catalog only. No credentials, custom URLs or user data.
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const parsed = catalogSchema.safeParse(await response.json());
    return parsed.success
      ? parsed.data.data
          .filter((model) => model.supported_parameters?.includes("tools"))
          .map(({ id, name }) => ({ id, name }))
          .slice(0, 500)
      : [];
  } catch {
    return [];
  }
}
