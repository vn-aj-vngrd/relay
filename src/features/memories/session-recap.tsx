import {
  ArrowClockwise,
  ArrowRight,
  ShareNetwork,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/content-state";
import { ButtonLink } from "@/components/ui/button";
import { MatchResults } from "@/features/matches/match-results";
import { SessionStandings } from "@/features/matches/session-standings";
import { formatSessionDateLong } from "@/features/sessions/format";
import type { PostGameContinuation } from "@/features/sessions/post-game";

import type { SessionRecap as SessionRecapData } from "./recap";
import { RecapHighlights, RecapOverview } from "./recap-summary";

export function SessionRecap({
  session,
  recap,
  storyHref,
  continuation,
  canCorrectScores = false,
  feedback,
}: {
  session: {
    id: string;
    title: string;
    venueName: string;
    startsAt: Date;
    status: "draft" | "published" | "live" | "completed" | "cancelled";
  };
  recap: SessionRecapData;
  storyHref: string;
  continuation?: PostGameContinuation;
  canCorrectScores?: boolean;
  feedback?: ReactNode;
}) {
  const date = formatSessionDateLong(session.startsAt);
  const completed = session.status === "completed";
  const inProgress = session.status === "live";

  return (
    <div className="space-y-8 sm:space-y-10">
      <RecapOverview
        recap={recap}
        statusLabel={
          completed
            ? "Final recap"
            : inProgress
              ? "Recap in progress"
              : "Recap preview"
        }
        context={`${date} · ${session.venueName}`}
        title={
          completed
            ? session.title
            : inProgress
              ? `${session.title} is taking shape.`
              : `${session.title} starts here.`
        }
        description={
          completed
            ? "The final scores, pairings, and court time from the game."
            : inProgress
              ? "Completed matches are already filling the game’s results."
              : "Scores, pairings, and standings will collect here as the game unfolds."
        }
      />

      {!completed ? (
        <section
          className="border-y border-line py-5"
          aria-label="Recap status"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${inProgress ? "bg-live" : "bg-surface-raised"}`}
            />
            <div>
              <h2 className="font-bold">
                {inProgress
                  ? "Building as you play"
                  : "Waiting for the first result"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {inProgress
                  ? recap.matchCount
                    ? `${recap.matchCount} completed ${recap.matchCount === 1 ? "match is" : "matches are"} included so far. The final recap locks when the host ends the session.`
                    : "Finish the first match to start filling the highlights and standings."
                  : "Once play begins, completed matches will fill the highlights and standings automatically."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <MatchResults
        sessionId={session.id}
        results={recap.results}
        canCorrect={canCorrectScores}
        heading={completed ? "Match results" : "Completed matches"}
      />

      {recap.matchCount ? (
        <RecapHighlights recap={recap} completed={completed} />
      ) : (
        <EmptyState
          icon="results"
          title={
            completed
              ? "The scores stayed off—and that’s okay"
              : "No completed matches yet"
          }
          description={
            completed
              ? "The crew can still keep photos in Story without inventing results."
              : "This space will update after the first final score. Nothing needs to be prepared here."
          }
          className="border-y border-line"
        />
      )}

      <SessionStandings standings={recap.standings} />

      {completed ? feedback : null}

      {completed && continuation ? (
        <section
          className="border-y border-line py-7 sm:py-8"
          aria-labelledby="post-game-title"
        >
          <p className="sport-label text-primary">Next game</p>
          <h2
            id="post-game-title"
            className="mt-2 text-2xl font-bold tracking-[-0.025em] text-balance"
          >
            Keep this crew moving.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Replay copies the plan and brings signed-in players forward as fresh
            invitations. Previous responses and scores stay with this game.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <ButtonLink
              href={continuation.replayHref}
              size="large"
              className="sm:min-w-36"
            >
              <ArrowClockwise aria-hidden size={17} /> Play again
            </ButtonLink>
            {continuation.saveCrewHref ? (
              <ButtonLink
                href={continuation.saveCrewHref}
                variant="secondary"
                size="large"
                className="sm:min-w-36"
              >
                <UsersThree aria-hidden size={17} /> Save this crew
              </ButtonLink>
            ) : null}
            <ButtonLink
              href={storyHref}
              variant="quiet"
              size="large"
              className="sm:min-w-36"
            >
              <ShareNetwork aria-hidden size={17} /> Share recap
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section
          className="border-t border-line pb-8 pt-6"
          aria-labelledby="recap-story-title"
        >
          <h2 id="recap-story-title" className="text-lg font-bold">
            {completed
              ? "Keep what happened off the scoreboard"
              : inProgress
                ? "Share a live update"
                : "Share the invitation"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {completed
              ? "Build a story-ready highlight and add photos from the game."
              : inProgress
                ? "Story shares completed-match and court counts without provisional player details."
                : "Story turns the current game plan and availability into a shareable portrait."}
          </p>
          <ButtonLink href={storyHref} variant="secondary" className="mt-4">
            Open story <ArrowRight aria-hidden size={16} />
          </ButtonLink>
        </section>
      )}
    </div>
  );
}
