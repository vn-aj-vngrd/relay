import { PublicSessionHeader } from "@/components/shared/public-session-header";
import { PublicThemeFooter } from "@/components/shared/public-theme-footer";
import { getCurrentUser } from "@/features/auth/session";
import { getPublicSession, getSessionMembership } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { canParticipate } from "@/features/sessions/viewer";

export default async function PublicSessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const [user, data] = await Promise.all([getCurrentUser(), getPublicSession(slug)]);
  const membership = user && data ? await getSessionMembership(data.session.id, user.id) : null;
  const canOpenGame = Boolean(
    user && data && (data.session.hostId === user.id || (membership && canParticipate(membership.rsvp))),
  );
  return (
    <div className="public-session-layout flex min-h-dvh flex-col bg-surface">
      {data ? <RealtimeRefresh sessionId={data.session.id} silent /> : null}
      <PublicSessionHeader
        slug={slug}
        signedIn={Boolean(user)}
        gameHref={canOpenGame && data ? `/games/${data.session.id}` : undefined}
        accentColor={data?.session.accentColor}
        gameTitle={data?.session.title}
      />
      <div className="public-session-tab-content min-h-0 flex-1 bg-surface">{children}</div>
      <PublicThemeFooter className="bg-surface" />
    </div>
  );
}
