import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Add a group name with at least 2 characters.").max(60, "Keep the group name under 60 characters."),
  description: z.string().trim().max(300, "Keep the description under 300 characters.").optional(),
  sourceSessionId: z.uuid().optional(),
});

export const addGroupMemberSchema = z.object({
  groupId: z.uuid(),
  username: z.string().trim().toLowerCase().min(2, "Enter a username.").max(40, "Enter a valid username."),
});

export function groupSlug(name: string) {
  const words = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 44) || "crew";
  return `${words}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6)}`;
}
