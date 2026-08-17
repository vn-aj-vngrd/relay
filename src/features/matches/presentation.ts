export function startMatchLabel(completedMatchCount: number) {
  return completedMatchCount > 0 ? "Start next match" : "Start first match";
}
