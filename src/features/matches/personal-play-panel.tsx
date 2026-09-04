import {
  CheckCircle,
  CourtBasketball,
  HourglassMedium,
  Pause,
} from "@phosphor-icons/react/dist/ssr";

import { PlayAvailabilityControl } from "@/features/sessions/attendance-toggle";

import type { PersonalPlayState } from "./lifecycle";
import {
  ReadyAcknowledgement,
  ReplacementRequest,
} from "./play-management-controls";

type RecentResult = {
  courtLabel: string;
  score: string;
  won: boolean;
} | null;

export function PersonalPlayPanel({
  sessionId,
  playerId,
  state,
  queueState,
  playerState,
  recentResult,
}: {
  sessionId: string;
  playerId: string;
  state: PersonalPlayState;
  queueState?: string | null;
  playerState: string;
  recentResult: RecentResult;
}) {
  if (state.kind === "not_participating") return null;

  const availability = (
    <PlayAvailabilityControl
      sessionId={sessionId}
      sessionPlayerId={playerId}
      name="yourself"
      queueState={queueState}
      playerState={playerState}
      compact
    />
  );

  if (state.kind === "playing")
    return (
      <section
        aria-labelledby="your-play-title"
        aria-live="polite"
        className="mb-7 border-y border-primary/25 bg-primary-soft px-4 py-5 sm:rounded-xl sm:border"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal text-court">
            <CourtBasketball aria-hidden size={21} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="your-play-title" className="text-xl font-bold">
              You’re playing · {state.courtLabel}
            </h2>
            <p className="mt-1 break-words text-sm leading-6 text-muted">
              {state.partnerNames.length
                ? `With ${state.partnerNames.join(" + ")} against ${state.opponentNames.join(" + ")}.`
                : `Against ${state.opponentNames.join(" + ")}.`}
            </p>
            <div className="mt-4 flex flex-wrap items-start gap-3">
              {availability}
              <ReplacementRequest
                sessionId={sessionId}
                matchId={state.matchId}
              />
            </div>
          </div>
        </div>
      </section>
    );

  if (state.kind === "waiting") {
    const unit = state.fixedPair ? "pair" : "player";
    const queueCopy = state.groupsAhead
      ? `${state.groupsAhead} ${state.groupsAhead === 1 ? "group" : "groups"} ahead`
      : `First ${unit} in the queue`;
    return (
      <section
        aria-labelledby="your-play-title"
        aria-live="polite"
        className="mb-7 border-y border-line bg-surface-raised px-4 py-5 sm:rounded-xl sm:border"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-signal text-court">
            {state.ready ? (
              <CheckCircle aria-hidden size={22} weight="fill" />
            ) : (
              <HourglassMedium aria-hidden size={21} weight="fill" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="your-play-title" className="text-xl font-bold">
              {state.ready ? "Get ready" : "You’re waiting"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {queueCopy}. Court availability and the current result can still
              change the next assignment.
            </p>
            {recentResult ? (
              <p className="mt-2 text-sm font-semibold">
                Last match · {recentResult.won ? "Won" : "Lost"}{" "}
                {recentResult.score} on {recentResult.courtLabel}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-start gap-3">
              {state.ready && !state.acknowledged ? (
                <ReadyAcknowledgement sessionId={sessionId} />
              ) : state.ready ? (
                <p className="min-h-9 py-2 text-sm font-semibold text-primary">
                  Organizers can see you’re ready.
                </p>
              ) : null}
              {availability}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="your-play-title"
      aria-live="polite"
      className="mb-7 border-y border-line px-4 py-5 sm:rounded-xl sm:border"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-raised text-muted">
          <Pause aria-hidden size={20} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="your-play-title" className="text-xl font-bold">
            {state.kind === "not_here"
              ? "You’re not in the queue"
              : "You’re taking a break"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Rejoin when you’re ready. You’ll enter at the end of the current
            queue.
          </p>
          <div className="mt-4">{availability}</div>
        </div>
      </div>
    </section>
  );
}
