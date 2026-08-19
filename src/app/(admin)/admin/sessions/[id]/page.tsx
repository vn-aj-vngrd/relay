import {
  ArrowLeft,
  ArrowSquareOut,
  ChatCircle,
  CurrencyCircleDollar,
  MapPin,
  Trophy,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { ModerationControl } from "@/features/admin/moderation-control";
import { AdminDate, AdminStatus } from "@/features/admin/presentation";
import { getAdminSession } from "@/features/admin/queries";
import { formatSessionTime, peso } from "@/features/sessions/format";

export default async function AdminSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const record = await getAdminSession(parsed.data);
  if (!record) notFound();
  const game = record.session;

  return (
    <div>
      <Link
        href="/admin/sessions"
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} />
        All games
      </Link>
      <AdminPageHeading
        title={game.title}
        description={`${record.hostName ?? record.hostEmail} · ${game.venueName}`}
        action={
          <div className="flex items-center gap-3">
            <AdminStatus value={game.status} />
            <Link
              href={`/s/${game.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary"
            >
              Public page <ArrowSquareOut size={16} />
            </Link>
          </div>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="game-details">
          <h2 id="game-details" className="text-lg font-bold">
            Game details
          </h2>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Date</dt>
              <dd>
                <AdminDate value={game.startsAt} />
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Time</dt>
              <dd className="score text-sm font-semibold">{formatSessionTime(game.startsAt, game.endsAt)}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <MapPin size={16} />
                Venue
              </dt>
              <dd className="text-sm font-medium">
                {game.venueName}
                {game.venueAddress ? (
                  <span className="mt-1 block font-normal text-muted">{game.venueAddress}</span>
                ) : null}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Visibility</dt>
              <dd className="text-sm font-medium capitalize">{game.visibility}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Estimated cost</dt>
              <dd className="score text-sm font-semibold">
                {game.estimatedCostCents ? peso(game.estimatedCostCents) : "Not set"}
              </dd>
            </div>
          </dl>
          {game.notes ? (
            <div className="mt-8">
              <h2 className="text-lg font-bold">Host notes</h2>
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-muted">{game.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-muted">Activity</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line">
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <Users size={17} />
                  Players
                </dt>
                <dd className="score font-bold">
                  {record.playerCount} / {game.capacity}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <Trophy size={17} />
                  Matches
                </dt>
                <dd className="score font-bold">{record.matchCount}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <ChatCircle size={17} />
                  Messages
                </dt>
                <dd className="score font-bold">{record.messageCount}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <CurrencyCircleDollar size={17} />
                  Expenses
                </dt>
                <dd className="score font-bold">{record.expenseCount}</dd>
              </div>
            </dl>
          </section>
          <section className="border-t border-line pt-5">
            <h2 className="text-sm font-semibold">Production action</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cancellation preserves the roster, messages, payments, and match history.
            </p>
            <div className="mt-4">
              {game.status === "cancelled" || game.status === "completed" ? (
                <p className="text-sm font-medium text-muted">No moderation action is available for this game.</p>
              ) : (
                <ModerationControl mode="cancel-session" targetId={game.id} />
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
