export function createSessionDestination(sessionId: string, published: boolean) {
  return `/games/${sessionId}${published ? "?created=1" : ""}`;
}
