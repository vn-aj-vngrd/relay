import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { AppBreadcrumbs } from "@/components/shared/app-breadcrumbs";
import {
  AuthenticatedSessionNav,
  MobileAuthenticatedSessionNav,
} from "@/components/shared/authenticated-session-nav";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { sessionAccentStyle } from "@/features/sessions/accent";
import {
  formatSessionDate,
  formatSessionTime,
} from "@/features/sessions/format";
import { GameWorkspaceActions } from "@/features/sessions/game-workspace-actions";
import { getSessionForWorkspace } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { canManageSessionWorkspace } from "@/features/sessions/session-access";

export default async function GameWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const id = (await params).id;
  const data = await getSessionForWorkspace(id, user.id);
  if (!data) notFound();
  const canManage = canManageSessionWorkspace(data.access);
  const qrDetails = `${formatSessionDate(data.session.startsAt, data.session.timezone)} · ${formatSessionTime(data.session.startsAt, data.session.endsAt, data.session.timezone)} · ${data.session.venueName}`;

  return (
    <div
      className="game-workspace -mt-7 flex h-[calc(100%+1.75rem)] min-h-0 flex-col sm:-mt-9 sm:h-[calc(100%+2.25rem)] lg:mt-0 lg:h-full"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <RealtimeRefresh sessionId={id} silent />
      <div className="hidden shrink-0 lg:block [&>nav]:mb-0">
        <AppBreadcrumbs
          items={[
            { href: "/home", label: "Home" },
            { href: "/games", label: "Games" },
            { label: data.session.title },
          ]}
        />
      </div>
      <div className="session-tab-safe sticky top-0 z-20 -mx-4 shrink-0 border-b border-line bg-surface sm:-mx-8 lg:mx-0">
        <div className="px-4 pb-1 sm:hidden">
          <div className="flex h-12 min-w-0 items-center gap-1">
            <ButtonLink
              href="/games"
              variant="quiet"
              aria-label="Back to games"
              className="-ml-3 h-11 min-h-11 w-11 shrink-0 px-0"
            >
              <CaretLeft aria-hidden size={18} />
            </ButtonLink>
            <p
              title={data.session.title}
              className="min-w-0 flex-1 truncate text-sm font-semibold text-ink"
            >
              {data.session.title}
            </p>
            <GameWorkspaceActions
              mode="mobile"
              canManage={canManage}
              editHref={`/games/${id}/settings`}
              shareUrl={`/s/${data.session.slug}`}
              title={data.session.title}
              sessionId={data.session.id}
              qrEnabled={data.session.visibility !== "private"}
              qrDetails={qrDetails}
            />
          </div>
          <MobileAuthenticatedSessionNav id={id} />
        </div>
        <div className="hidden items-center pr-8 sm:flex lg:pr-0">
          <AuthenticatedSessionNav id={id} />
          <GameWorkspaceActions
            mode="desktop"
            canManage={canManage}
            editHref={`/games/${id}/settings`}
            shareUrl={`/s/${data.session.slug}`}
            title={data.session.title}
            sessionId={data.session.id}
            qrEnabled={data.session.visibility !== "private"}
            qrDetails={qrDetails}
          />
        </div>
      </div>
      <div className="game-workspace-content min-h-0 flex-1 pt-3 sm:pt-4">
        {children}
      </div>
    </div>
  );
}
