import { z } from "zod";

export const groupFiltersSchema = z.object({
  q: z.string().trim().max(200).default(""),
  role: z.enum(["any", "owner", "member"]).default("any"),
});
export type GroupFilters = z.infer<typeof groupFiltersSchema>;
export const defaultGroupFilters = groupFiltersSchema.parse({});
export function groupFilterParams(filters: GroupFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.role !== "any") params.set("role", filters.role);
  return params;
}
export function parseGroupFilters(params: {
  get: (key: string) => string | null;
}) {
  return groupFiltersSchema.safeParse({
    q: params.get("q") ?? "",
    role: params.get("role") ?? "any",
  });
}
