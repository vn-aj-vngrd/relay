export function courtLabel(position: number | null | undefined) {
  return position == null ? "Court" : `Court ${position}`;
}

export function startMatchLabel(completedMatchCount: number) {
  return completedMatchCount > 0 ? "Start next match" : "Start first match";
}
