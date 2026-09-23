import Link from "next/link";

import { Skeleton } from "@/components/shared/skeleton";

export default function NotificationsLoading() {
  return (
    <div
      role="status"
      className="mx-auto w-full max-w-6xl"
      aria-label="Loading notifications"
      aria-busy="true"
    >
      <header className="border-b border-line pb-6">
        <h1 className="app-title">Notifications</h1>
        <Skeleton className="mt-2 h-3.5 w-24" />
      </header>
      <nav
        aria-label="Notification filters"
        className="flex border-b border-line"
      >
        <Link
          href="/notifications"
          className="flex min-h-11 items-center px-3 text-sm font-medium text-ink"
        >
          All
        </Link>
        <Link
          href="/notifications?filter=unread"
          className="flex min-h-11 items-center px-3 text-sm font-medium text-muted"
        >
          Unread
        </Link>
      </nav>
      <section className="pt-7">
        <div className="divide-y divide-line border-y border-line">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-20 items-start gap-3 px-1 py-4 sm:px-3"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
