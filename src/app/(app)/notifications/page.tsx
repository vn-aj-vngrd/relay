import { Check } from "@phosphor-icons/react/dist/ssr";
import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { NotificationFeed } from "@/features/notifications/notification-feed";
import { getNotificationPage, type NotificationFilter } from "@/features/notifications/queries";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const filter: NotificationFilter = (await searchParams).filter === "unread" ? "unread" : "all";
  const unreadWhere = and(eq(notifications.userId, user.id), isNull(notifications.readAt));
  const [unreadCount, initialPage] = await Promise.all([
    db.$count(notifications, unreadWhere),
    getNotificationPage(user.id, filter),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="app-title">Notifications</h1>
          <p className="mt-2 text-sm text-muted">
            {unreadCount ? `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}` : "You’re caught up"}
          </p>
        </div>
        {unreadCount ? (
          <form noValidate action={markAllNotificationsRead}>
            <SubmitButton variant="secondary" pendingLabel="Marking read…">
              <Check aria-hidden size={16} />
              Mark all read
            </SubmitButton>
          </form>
        ) : null}
      </header>

      <nav aria-label="Notification filters" className="flex border-b border-line">
        <Link
          href="/notifications"
          aria-current={filter === "all" ? "page" : undefined}
          className={`relative flex min-h-11 items-center px-3 text-sm font-medium ${filter === "all" ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted hover:text-ink"}`}
        >
          All
        </Link>
        <Link
          href="/notifications?filter=unread"
          aria-current={filter === "unread" ? "page" : undefined}
          className={`relative flex min-h-11 items-center gap-2 px-3 text-sm font-medium ${filter === "unread" ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted hover:text-ink"}`}
        >
          Unread
          {unreadCount ? (
            <span className="score text-xs text-primary">{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </Link>
      </nav>

      <NotificationFeed key={filter} initialPage={initialPage} filter={filter} />
    </div>
  );
}
