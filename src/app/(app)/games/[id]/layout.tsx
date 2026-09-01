import { CaretLeft, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { AppBreadcrumbs } from "@/components/shared/app-breadcrumbs";
import { AuthenticatedSessionNav } from "@/components/shared/authenticated-session-nav";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getSessionForUser } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { ShareButton } from "@/features/sessions/share-button";

export default async function GameWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const id = (await params).id;
  const data = await getSessionForUser(id, user.id);
  if (!data) notFound();
  const participant =
    data.session.hostId === user.id ||
    Boolean(data.membership && ["going", "maybe", "waitlisted"].includes(data.membership.rsvp));
  if (!participant) return children;
  const canManage = data.session.hostId === user.id || data.membership?.role === "cohost";

  return (
    <div
      className="game-workspace -mt-7 flex h-[calc(100%+1.75rem)] min-h-0 flex-col sm:-mt-9 sm:h-[calc(100%+2.25rem)] lg:mt-0 lg:h-full"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <RealtimeRefresh sessionId={id} silent />
      <div className="hidden shrink-0 lg:block [&>nav]:mb-0">
        <AppBreadcrumbs
          items={[{ href: "/home", label: "Home" }, { href: "/games", label: "Games" }, { label: data.session.title }]}
        />
      </div>
      <div className="game-workspace-actions flex shrink-0 items-center justify-between gap-3 py-2.5 sm:py-4 lg:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <ButtonLink
            href="/games"
            variant="quiet"
            aria-label="Back to games"
            className="game-workspace-action-button -ml-3 h-11 min-h-11 w-11 shrink-0 px-0 sm:ml-0 sm:h-9 sm:min-h-9 sm:w-9 lg:h-8 lg:min-h-8 lg:w-8"
          >
            <CaretLeft aria-hidden size={18} />
            <span className="sr-only">Games</span>
          </ButtonLink>
          <p title={data.session.title} className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
            {data.session.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0 sm:gap-2">
          {canManage ? (
            <ButtonLink
              href={`/games/${id}/settings`}
              variant="secondary"
              aria-label="Edit game"
              className="game-workspace-action-button h-11 min-h-11 w-11 border-transparent bg-transparent px-0 sm:h-auto sm:min-h-9 sm:w-auto sm:border-line sm:bg-surface sm:px-3"
            >
              <PencilSimple aria-hidden size={16} />
              <span className="game-workspace-action-label sr-only sm:not-sr-only">Edit game</span>
            </ButtonLink>
          ) : null}
          <ShareButton
            url={`/s/${data.session.slug}`}
            title={data.session.title}
            sessionId={data.session.id}
            compactOnMobile
          />
        </div>
      </div>
      <div className="session-tab-safe sticky top-0 z-20 -mx-4 shrink-0 border-b border-line bg-surface sm:-mx-8 lg:mx-0">
        <AuthenticatedSessionNav id={id} />
      </div>
      <div className="min-h-0 flex-1 pt-3 sm:pt-4">{children}</div>
    </div>
  );
}
