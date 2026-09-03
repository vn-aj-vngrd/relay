import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { SessionChatView } from "@/features/chat/session-chat-view";
import { getSessionForWorkspace } from "@/features/sessions/queries";
import { canParticipateInWorkspace } from "@/features/sessions/session-access";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const sessionId = (await params).id;
  const data = await getSessionForWorkspace(sessionId, user.id);
  if (!data) notFound();
  const canWrite = Boolean(
    data.membership && canParticipateInWorkspace(data.access)
  );

  return (
    <div className="authenticated-chat-page flex h-full min-h-0 flex-col overflow-hidden">
      <GamePageIntro
        title="Chat"
        description="Plans, updates, and photos from the group."
      />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
        <div className="min-h-0 w-full overflow-hidden sm:rounded-xl sm:border sm:border-line">
          <SessionChatView
            sessionId={sessionId}
            timezone={data.session.timezone}
            viewer={{
              userId: user.id,
              playerId: data.membership?.id ?? "",
              canWrite,
            }}
            readOnlyMessage="Join the game to send messages and photos."
            className="authenticated-chat-viewport h-full"
          />
        </div>
      </div>
    </div>
  );
}
