import {
  Bell,
  CalendarCheck,
  CaretRight,
  Check,
  CurrencyCircleDollar,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { and, desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db/client";
import { notifications, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { markAllNotificationsRead, openNotification } from "@/features/notifications/actions";
import {
  type NotificationGroup,
  notificationGroup,
  notificationPresentation,
  notificationTime,
  type NotificationTone,
} from "@/features/notifications/domain";

const groupOrder: NotificationGroup[] = ["Today", "This week", "Earlier"];
const toneIcons = {
  session: CalendarCheck,
  players: UsersThree,
  payment: CurrencyCircleDollar,
  play: Trophy,
  system: Bell,
} satisfies Record<NotificationTone, typeof Bell>;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const filter = (await searchParams).filter === "unread" ? "unread" : "all";
  const unreadWhere = and(eq(notifications.userId, user.id), isNull(notifications.readAt));
  const [unreadCount, rows] = await Promise.all([
    db.$count(notifications, unreadWhere),
    db
      .select({ notification: notifications, sessionTitle: sessions.title })
      .from(notifications)
      .leftJoin(sessions, eq(notifications.sessionId, sessions.id))
      .where(filter === "unread" ? unreadWhere : eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(100),
  ]);
  const groups = new Map<NotificationGroup, typeof rows>();
  for (const row of rows) {
    const group = notificationGroup(row.notification.createdAt);
    groups.set(group, [...(groups.get(group) ?? []), row]);
  }

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
          <form action={markAllNotificationsRead}>
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

      {rows.length ? (
        <div className="pt-2">
          {groupOrder.map((group) => {
            const items = groups.get(group);
            if (!items?.length) return null;
            return (
              <section
                key={group}
                aria-labelledby={`notifications-${group.replaceAll(" ", "-").toLowerCase()}`}
                className="pt-7"
              >
                <h2
                  id={`notifications-${group.replaceAll(" ", "-").toLowerCase()}`}
                  className="px-1 text-xs font-semibold uppercase tracking-[0.04em] text-muted"
                >
                  {group}
                </h2>
                <div className="mt-2 divide-y divide-line border-y border-line">
                  {items.map(({ notification, sessionTitle }) => {
                    const presentation = notificationPresentation({
                      type: notification.type,
                      sessionId: notification.sessionId,
                      sessionTitle,
                      payload: notification.payload,
                    });
                    const Icon = toneIcons[presentation.tone];
                    const unread = !notification.readAt;
                    return (
                      <form action={openNotification} key={notification.id}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <button
                          type="submit"
                          className="pressable group relative flex min-h-20 w-full items-start gap-3 px-1 py-4 text-left hover:bg-surface-strong/45 sm:px-3"
                        >
                          <span
                            className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${unread ? "bg-primary-soft text-primary" : "bg-surface-strong text-muted"}`}
                          >
                            <Icon aria-hidden size={17} weight={unread ? "fill" : "regular"} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start gap-2">
                              <strong className="text-sm font-semibold leading-5 text-ink">{presentation.title}</strong>
                              {unread ? (
                                <span
                                  role="img"
                                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                                  aria-label="Unread"
                                />
                              ) : null}
                            </span>
                            <span className="mt-1 block max-w-2xl text-sm leading-5 text-muted">
                              {presentation.body}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 pt-0.5">
                            <time
                              dateTime={notification.createdAt.toISOString()}
                              className="score text-[11px] text-muted"
                            >
                              {notificationTime(notification.createdAt, group)}
                            </time>
                            <CaretRight
                              aria-hidden
                              size={13}
                              className="text-muted transition-transform group-hover:translate-x-0.5"
                            />
                          </span>
                        </button>
                      </form>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="mt-8 border-y border-line py-12 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface-strong text-muted">
            <Bell aria-hidden size={19} />
          </span>
          <h2 className="mt-4 text-lg font-bold">{filter === "unread" ? "No unread updates" : "Nothing here yet"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {filter === "unread"
              ? "New invites, roster changes, payment updates, and court assignments will appear here."
              : "Relay will keep game invites, roster changes, payments, and court assignments together here."}
          </p>
          {filter === "unread" ? (
            <Link href="/notifications" className="mt-5 inline-flex min-h-10 items-center font-semibold text-primary">
              View all notifications
            </Link>
          ) : null}
        </section>
      )}
    </div>
  );
}
