import { ArrowRight, ChatText, ClockCounterClockwise, MapPin, Users, Volleyball } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { AdminDate } from "@/features/admin/presentation";
import { getAdminOverview } from "@/features/admin/queries";

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();

  return (
    <div>
      <AdminPageHeading
        title="Operations overview"
        description="A focused view of account health, game activity, and recent privileged changes in production."
      />

      <section
        aria-label="Production totals"
        className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line"
      >
        <div className="py-5 lg:px-5 lg:first:pl-0">
          <p className="text-sm font-medium text-muted">Registered users</p>
          <p className="score mt-2 text-3xl font-bold">{data.userCount}</p>
          <p className="mt-1 text-xs text-muted">+{data.newUsers} in the last 7 days</p>
        </div>
        <div className="border-t border-line py-5 sm:border-l sm:border-t-0 sm:pl-5 lg:border-l-0 lg:px-5">
          <p className="text-sm font-medium text-muted">Games created</p>
          <p className="score mt-2 text-3xl font-bold">{data.sessionCount}</p>
          <p className="mt-1 text-xs text-muted">{data.upcomingSessions} upcoming</p>
        </div>
        <div className="border-t border-line py-5 lg:border-t-0 lg:px-5">
          <p className="text-sm font-medium text-muted">Live right now</p>
          <p className="score mt-2 text-3xl font-bold">{data.liveSessions}</p>
          <p className="mt-1 text-xs text-muted">{data.suspendedUsers} suspended accounts</p>
        </div>
        <div className="border-t border-line py-5 sm:border-l sm:pl-5 lg:border-l-0 lg:border-t-0 lg:px-5">
          <p className="text-sm font-medium text-muted">New feedback</p>
          <p className="score mt-2 text-3xl font-bold">{data.newFeedbackCount}</p>
          <p className="mt-1 text-xs text-muted">Waiting for review</p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="product-loop-title">
        <div>
          <h2 id="product-loop-title" className="text-lg font-bold">
            Product loop · 30 days
          </h2>
          <p className="mt-1 text-sm text-muted">Lifecycle events only—no names, chat, payment details, or scores.</p>
        </div>
        <dl className="mt-4 grid border-y border-line sm:grid-cols-5 sm:divide-x sm:divide-line">
          {[
            ["Published", "session_published"],
            ["RSVPs", "rsvp_saved"],
            ["Play started", "play_started"],
            ["Completed", "session_completed"],
            ["Recaps shared", "recap_shared"],
          ].map(([label, event]) => (
            <div
              key={event}
              className="flex items-center justify-between border-t border-line py-3 first:border-t-0 sm:block sm:border-t-0 sm:px-4 sm:py-4 sm:first:pl-0"
            >
              <dt className="text-xs font-medium text-muted">{label}</dt>
              <dd className="score text-xl font-bold sm:mt-2">{data.lifecycle.get(event) ?? 0}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
        <section aria-labelledby="admin-shortcuts">
          <h2 id="admin-shortcuts" className="text-lg font-bold">
            Manage production
          </h2>
          <div className="mt-3 divide-y divide-line border-y border-line">
            <Link
              href="/admin/users"
              className="pressable flex min-h-20 items-center gap-3 py-4 hover:bg-surface-strong sm:px-2"
            >
              <Users aria-hidden size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Users</p>
                <p className="mt-1 text-sm text-muted">Find accounts and review access</p>
              </div>
              <ArrowRight aria-hidden size={17} className="text-muted" />
            </Link>
            <Link
              href="/admin/sessions"
              className="pressable flex min-h-20 items-center gap-3 py-4 hover:bg-surface-strong sm:px-2"
            >
              <Volleyball aria-hidden size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Games</p>
                <p className="mt-1 text-sm text-muted">Inspect active and historical sessions</p>
              </div>
              <ArrowRight aria-hidden size={17} className="text-muted" />
            </Link>
            <Link
              href="/admin/courts"
              className="pressable flex min-h-20 items-center gap-3 py-4 hover:bg-surface-strong sm:px-2"
            >
              <MapPin aria-hidden size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Courts</p>
                <p className="mt-1 text-sm text-muted">Verify Cebu courts and submissions</p>
              </div>
              <ArrowRight aria-hidden size={17} className="text-muted" />
            </Link>
            <Link
              href="/admin/feedback"
              className="pressable flex min-h-20 items-center gap-3 py-4 hover:bg-surface-strong sm:px-2"
            >
              <ChatText aria-hidden size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Feedback</p>
                <p className="mt-1 text-sm text-muted">Triage reports and product requests</p>
              </div>
              <ArrowRight aria-hidden size={17} className="text-muted" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="recent-actions">
          <div className="flex items-center justify-between">
            <h2 id="recent-actions" className="text-lg font-bold">
              Recent admin activity
            </h2>
            <Link href="/admin/audit" className="text-sm font-semibold text-primary">
              View audit log
            </Link>
          </div>
          {data.recentActions.length ? (
            <ol className="mt-3 divide-y divide-line border-y border-line">
              {data.recentActions.map(({ log, actorEmail }) => (
                <li key={log.id} className="flex gap-3 py-4">
                  <ClockCounterClockwise aria-hidden size={18} className="mt-0.5 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{log.action.replace(".", " ")}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {actorEmail} · {log.targetType} {log.targetId.slice(0, 8)}
                    </p>
                  </div>
                  <AdminDate value={log.createdAt} includeTime />
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 border-y border-line py-10 text-center">
              <p className="text-sm font-medium">No admin changes yet</p>
              <p className="mt-1 text-sm text-muted">Privileged actions will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
