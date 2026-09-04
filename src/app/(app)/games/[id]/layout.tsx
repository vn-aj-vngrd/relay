import { notFound } from "next/navigation";

import { requireUser } from "@/features/auth/session";
import { getCompactPersonalPlayStatus } from "@/features/matches/queries";
import { sessionAccentStyle } from "@/features/sessions/accent";
import {
  formatSessionDate,
  formatSessionTime,
} from "@/features/sessions/format";
import { GameWorkspaceFrame } from "@/features/sessions/game-workspace-frame";
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
  const [data, personalStatus] = await Promise.all([
    getSessionForWorkspace(id, user.id),
    getCompactPersonalPlayStatus(id, user.id),
  ]);
  if (!data) notFound();
  const canManage = canManageSessionWorkspace(data.access);
  const qrDetails = `${formatSessionDate(data.session.startsAt, data.session.timezone)} · ${formatSessionTime(data.session.startsAt, data.session.endsAt, data.session.timezone)} · ${data.session.venueName}`;

  return (
    <div
      className="game-workspace -mt-7 flex h-[calc(100%+1.75rem)] min-h-0 flex-col sm:-mt-9 sm:h-[calc(100%+2.25rem)] lg:mt-0 lg:h-full"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <RealtimeRefresh sessionId={id} silent />
      <GameWorkspaceFrame
        sessionId={id}
        sessionTitle={data.session.title}
        sessionSlug={data.session.slug}
        canManage={canManage}
        qrEnabled={data.session.visibility !== "private"}
        qrDetails={qrDetails}
        playStatus={data.session.status === "live" ? personalStatus : null}
      >
        {children}
      </GameWorkspaceFrame>
    </div>
  );
}
