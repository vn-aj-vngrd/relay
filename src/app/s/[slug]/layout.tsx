import { PublicFooter } from "@/components/shared/public-footer";
import { PublicSessionHeader } from "@/components/shared/public-session-header";
import { getCurrentUser } from "@/features/auth/session";
import { getPublicSession, getSessionMembership } from "@/features/sessions/queries";
import { canParticipate } from "@/features/sessions/viewer";

export default async function PublicSessionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [user, data] = await Promise.all([getCurrentUser(), getPublicSession(slug)]);
  const membership = user && data ? await getSessionMembership(data.session.id, user.id) : null;
  const canOpenGame = Boolean(user && data && (data.session.hostId === user.id || (membership && canParticipate(membership.rsvp))));
  return <div className="flex h-dvh flex-col overflow-hidden bg-canvas"><PublicSessionHeader slug={slug} signedIn={Boolean(user)} gameHref={canOpenGame && data ? `/games/${data.session.id}` : undefined} accentColor={data?.session.accentColor} /><div className="public-session-tab-content min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{children}</div><PublicFooter /></div>;
}
