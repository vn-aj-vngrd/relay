import { PublicSessionHeader } from "@/components/shared/public-session-header";
import { getCurrentUser } from "@/features/auth/session";
import {
  getPublicSession,
  getSessionMembership,
} from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { resolveSessionWorkspaceAccess } from "@/features/sessions/session-access";

export default async function PublicSessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getPublicSession(slug),
  ]);
  const membership =
    user && data ? await getSessionMembership(data.session.id, user.id) : null;
  const canOpenGame = Boolean(
    user &&
      data &&
      resolveSessionWorkspaceAccess({
        userId: user.id,
        hostId: data.session.hostId,
        visibility: data.session.visibility,
        status: data.session.status,
        endsAt: data.session.endsAt,
        estimatedCostCents: data.session.estimatedCostCents,
        membership,
      })
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
      <div className="public-session-tab-content min-h-0 flex-1 bg-surface">
        {children}
      </div>
    </div>
  );
}
