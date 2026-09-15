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
    .max(10000),
});
const endpointSchema = z.object({
  data: z
    .array(
      z.object({
        model_id: z.string().max(150),
        model_name: z.string().max(200),
        supported_parameters: z.array(z.string()).optional(),
      })
    )
    .max(10000),
});

export async function getAgentModels(requireZeroRetention = true) {
  try {
    // Public catalog only. Filter to the same privacy/tool constraints as runtime.
    const response = await fetch(
      requireZeroRetention
        ? "https://openrouter.ai/api/v1/endpoints/zdr"
        : "https://openrouter.ai/api/v1/models",
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!response.ok) return [];
    const body: unknown = await response.json();
    if (!requireZeroRetention) {
      const catalog = catalogSchema.safeParse(body);
      return catalog.success
        ? catalog.data.data
            .filter((model) => model.supported_parameters?.includes("tools"))
            .map(({ id, name }) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [];
    }
    const parsed = endpointSchema.safeParse(body);
    if (!parsed.success) return [];
    const models = new Map<string, { id: string; name: string }>();
    for (const endpoint of parsed.data.data) {
      if (
        endpoint.supported_parameters?.includes("tools") &&
        endpoint.supported_parameters.includes("tool_choice")
      )
        models.set(endpoint.model_id, {
          id: endpoint.model_id,
          name: endpoint.model_name,
        });
    }
    return [...models.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
