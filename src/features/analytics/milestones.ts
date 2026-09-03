export function sessionMilestoneDedupeKey(sessionId: string, eventName: string) {
  return `session:${sessionId}:${eventName}`;
}
