import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comments, memories, memoryMedia, profiles, reactions } from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getSessionMemory(sessionId: string) {
  const memory = await db.query.memories.findFirst({ where: eq(memories.sessionId, sessionId) });
  if (!memory) return null;
  const [media, notes, loves] = await Promise.all([
    db.select().from(memoryMedia).where(eq(memoryMedia.memoryId, memory.id)).orderBy(asc(memoryMedia.createdAt)),
    db.select({ comment: comments, profile: profiles }).from(comments).leftJoin(profiles, eq(comments.authorId, profiles.userId)).where(eq(comments.memoryId, memory.id)).orderBy(asc(comments.createdAt)),
    db.$count(reactions, eq(reactions.memoryId, memory.id)),
  ]);
  const supabase = createSupabaseAdminClient();
  const withUrls = await Promise.all(media.map(async (item) => ({ ...item, url: (await supabase.storage.from("session-memories").createSignedUrl(item.storagePath, 3600)).data?.signedUrl ?? null })));
  return { memory, media: withUrls, comments: notes, reactionCount: loves };
}
