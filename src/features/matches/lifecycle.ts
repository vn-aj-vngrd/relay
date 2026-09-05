export type QueueMove = "top" | "up" | "down" | "end";

export function moveQueueGroup(
  orderedIds: string[],
  groupIds: string[],
  move: QueueMove
) {
  const selected = new Set(groupIds);
  const group = orderedIds.filter((id) => selected.has(id));
  if (!group.length) return orderedIds;
  const remaining = orderedIds.filter((id) => !selected.has(id));
  const firstIndex = orderedIds.findIndex((id) => selected.has(id));
  const insertionIndex = Math.max(
    0,
    Math.min(
      remaining.length,
      move === "top"
        ? 0
        : move === "end"
          ? remaining.length
          : move === "up"
            ? firstIndex - group.length
            : firstIndex + group.length
    )
  );
  return [
    ...remaining.slice(0, insertionIndex),
    ...group,
    ...remaining.slice(insertionIndex),
  ];
}

export function restoreCancelledPlayers(
  waiting: { id: string; position: number }[],
  cancelled: { id: string; position: number }[]
) {
  const cancelledIds = new Set(cancelled.map((item) => item.id));
  const current = waiting.filter((item) => !cancelledIds.has(item.id));
  const restored = cancelled.toSorted(
    (left, right) => left.position - right.position
  );
  const startPriority = restored[0]?.position ?? Number.MAX_SAFE_INTEGER;
  const insertionIndex = current.findIndex(
    (item) => item.position > startPriority
  );
  const index = insertionIndex === -1 ? current.length : insertionIndex;
  return [...current.slice(0, index), ...restored, ...current.slice(index)].map(
    (item, position) => ({ ...item, position: position + 1 })
  );
}
