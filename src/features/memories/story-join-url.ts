import "server-only";

import { getPublicEnv } from "@/lib/env";

/** Sharing eligibility is not RSVP authorization or Open games discovery. */
export function storyJoinUrl(session: {
  visibility: "public" | "link" | "private";
  status: string;
  slug: string;
}): string | null {
  if (
    (session.visibility !== "public" && session.visibility !== "link") ||
    session.status !== "published" ||
    !session.slug
  )
    return null;
  const origin = new URL(getPublicEnv().NEXT_PUBLIC_APP_URL);
  if (origin.protocol !== "https:" && origin.protocol !== "http:") return null;
  // Never inherit the current route, query, guest token, or authentication state.
  return new URL(`/s/${encodeURIComponent(session.slug)}`, origin.origin).href;
}
