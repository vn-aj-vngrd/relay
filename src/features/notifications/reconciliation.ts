import type { NotificationFeedItem, NotificationFilter } from "./queries";

function newestFirst(left: NotificationFeedItem, right: NotificationFeedItem) {
  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
    right.id.localeCompare(left.id)
  );
}

export function reconcileNotificationHead({
  current,
  previousHeadIds,
  refreshed,
  filter,
}: {
  current: NotificationFeedItem[];
  previousHeadIds: ReadonlySet<string>;
  refreshed: NotificationFeedItem[];
  filter: NotificationFilter;
}) {
  const authoritative =
    filter === "unread" ? refreshed.filter((item) => !item.readAt) : refreshed;
  const authoritativeIds = new Set(authoritative.map((item) => item.id));
  const preservedHistory = current.filter((item) => {
    if (authoritativeIds.has(item.id)) return false;
    return filter !== "unread" || !previousHeadIds.has(item.id);
  });
  return [...authoritative, ...preservedHistory].toSorted(newestFirst);
}
