type PostGameSession = {
  id: string;
  hostId: string;
  groupId: string | null;
  status: string;
};

export type PostGameContinuation = {
  replayHref: string;
  saveCrewHref?: string;
};

export function postGameContinuation(
  session: PostGameSession,
  viewerUserId: string
): PostGameContinuation | undefined {
  if (session.status !== "completed" || session.hostId !== viewerUserId)
    return undefined;
  return {
    replayHref: `/games/new?from=${session.id}`,
    ...(!session.groupId
      ? { saveCrewHref: `/groups/new?from=${session.id}` }
      : {}),
  };
}
