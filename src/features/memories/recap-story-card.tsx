import Image from "next/image";

import { RelayMark } from "@/components/shared/brand";

import type { SessionRecap } from "./recap";
import {
  invitationStateLabel,
  type RecapShareTemplateId,
  type StoryInvitationFacts,
  type StoryPhase,
  viewerStanding,
} from "./recap-share";

export type RecapBackground = {
  id: string;
  label: string;
  color?: string;
  imageUrl?: string;
  light?: boolean;
};

export type RecapStoryLayout = "courtside" | "center" | "poster" | "snapshot";

function SignedDifference({ value }: { value: number }) {
  return (
    <>
      {value > 0 ? "+" : ""}
      {value}
    </>
  );
}

export function RecapStoryCard({
  title,
  venue,
  date,
  recap,
  template,
  background,
  viewerPlayerId,
  layout = "courtside",
  overlay = 55,
  photoPosition = 50,
  customHeadline = "Our kind of game.",
  customNote = "",
  storyAsOf,
  className = "",
  phase = "completed",
  invitation,
  courtCount = 0,
}: {
  title: string;
  venue: string;
  date: string;
  accent: string;
  recap: SessionRecap;
  template: RecapShareTemplateId;
  background: RecapBackground;
  viewerPlayerId?: string | null;
  layout?: RecapStoryLayout;
  overlay?: number;
  photoPosition?: number;
  customHeadline?: string;
  customNote?: string;
  storyAsOf?: string;
  className?: string;
  phase?: StoryPhase;
  invitation?: StoryInvitationFacts;
  courtCount?: number;
}) {
  const personal = viewerStanding(recap, viewerPlayerId);
  const isInvitation = template === "invitation" || template === "spots";
  const light = Boolean(background.light) && !background.imageUrl;
  const foreground = light ? "text-[#17181d]" : "text-white";
  const secondary = light ? "text-[#17181d]/70" : "text-white/65";
  const contentPosition =
    layout === "poster"
      ? "top-[20%]"
      : layout === "center"
        ? "top-1/2 -translate-y-1/2"
        : "bottom-0";
  const contentFrame =
    layout === "snapshot"
      ? `m-[5%] rounded-[10px] border p-[6%] ${light ? "border-black/15 bg-white/78" : "border-white/20 bg-black/48"}`
      : "p-[7%]";

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${template.replaceAll("-", " ")} social recap preview`}
      className={`relative isolate aspect-[9/16] overflow-hidden rounded-xl [container-type:inline-size] ${foreground} ${className}`}
      style={{ backgroundColor: background.color ?? "#11131a" }}
    >
      {background.imageUrl ? (
        <>
          <Image
            src={background.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 430px"
            unoptimized={background.imageUrl.startsWith("blob:")}
            className="-z-20 object-cover"
            style={{ objectPosition: `center ${photoPosition}%` }}
          />
          <span
            className="absolute inset-0 -z-10 bg-black"
            style={{ opacity: overlay / 100 }}
            aria-hidden
          />
        </>
      ) : null}
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-[7%] text-[clamp(8px,3.4cqw,12px)] font-bold tracking-[0.08em]">
        <RelayMark className="h-[clamp(10px,4cqw,15px)] w-[clamp(10px,4cqw,15px)]" />
        RELAY ·{" "}
        {isInvitation
          ? `GAME INVITE · ${storyAsOf ?? "CURRENT PLAN"}`
          : phase === "live"
            ? `LIVE · ${storyAsOf ?? "CURRENT UPDATE"}`
            : "NIGHT MEMORY"}
      </div>
      <div className={`absolute inset-x-0 ${contentPosition}`}>
        <div className={contentFrame}>
          {template === "invitation" && invitation ? (
            <>
              <p className="line-clamp-3 break-words text-[clamp(20px,9cqw,42px)] font-bold leading-[1.02] tracking-[-0.04em]">
                {title}
              </p>
              <p className={`mt-2 text-[clamp(9px,3.6cqw,14px)] ${secondary}`}>
                {date} · {venue}
              </p>
              <p
                className={`mt-2 text-[clamp(9px,3.4cqw,13px)] font-semibold ${secondary}`}
              >
                Hosted by {invitation.hostName}
              </p>
              <div
                className={`mt-[10%] grid grid-cols-2 border-y py-[7%] ${light ? "border-black/15" : "border-white/20"}`}
              >
                <p>
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {invitation.priceLabel}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    per player
                  </span>
                </p>
                <p className="text-right">
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {invitation.goingCount}/{invitation.capacity}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    Going
                  </span>
                </p>
              </div>
              <p
                className={`mt-[7%] text-[clamp(10px,4cqw,15px)] ${secondary}`}
              >
                {invitationStateLabel(invitation)}
              </p>
            </>
          ) : null}

          {template === "spots" && invitation ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                WHO’S IN?
              </p>
              <p className="score mt-[7%] text-[clamp(48px,22cqw,92px)] font-bold leading-none tracking-[-0.04em]">
                {invitation.waitlistOpen
                  ? "FULL"
                  : Math.max(0, invitation.capacity - invitation.goingCount)}
              </p>
              <p className={`mt-3 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                {invitation.waitlistOpen
                  ? "Waitlist open"
                  : `${Math.max(0, invitation.capacity - invitation.goingCount)} ${invitation.capacity - invitation.goingCount === 1 ? "spot" : "spots"} open`}
              </p>
              <div
                className={`mt-[9%] border-y py-[6%] ${light ? "border-black/15" : "border-white/20"}`}
              >
                <p className="text-[clamp(17px,7cqw,32px)] font-bold leading-tight">
                  {title}
                </p>
                <p
                  className={`mt-2 text-[clamp(9px,3.5cqw,13px)] ${secondary}`}
                >
                  {date} · {venue}
                </p>
              </div>
              <p
                className={`mt-[6%] text-[clamp(9px,3.4cqw,13px)] font-semibold ${secondary}`}
              >
                Hosted by {invitation.hostName}
              </p>
            </>
          ) : null}

          {template === "live" ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                LIVE · AS OF {storyAsOf ?? "THIS UPDATE"}
              </p>
              <p className="mt-3 line-clamp-3 break-words text-[clamp(20px,9cqw,42px)] font-bold leading-[1.02] tracking-[-0.04em]">
                {title}
              </p>
              <p className={`mt-2 text-[clamp(9px,3.6cqw,14px)] ${secondary}`}>
                {venue}
              </p>
              <div
                className={`mt-[10%] grid grid-cols-2 border-y py-[7%] text-center ${light ? "border-black/15" : "border-white/20"}`}
              >
                <p>
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {recap.matchCount}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    completed matches
                  </span>
                </p>
                <p>
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {courtCount}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    {courtCount === 1 ? "planned court" : "planned courts"}
                  </span>
                </p>
              </div>
            </>
          ) : null}

          {template === "live-pulse" ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                MATCH PULSE
              </p>
              <p className="score mt-[7%] text-[clamp(48px,22cqw,92px)] font-bold leading-none tracking-[-0.06em]">
                {recap.matchCount}
              </p>
              <p className={`mt-3 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                {recap.matchCount === 1
                  ? "match complete at this snapshot"
                  : "matches complete at this snapshot"}
              </p>
              <div
                className={`mt-[10%] border-y py-[7%] ${light ? "border-black/15" : "border-white/20"}`}
              >
                <p className="text-[clamp(18px,7.5cqw,34px)] font-bold leading-tight">
                  {title}
                </p>
                <p
                  className={`mt-2 text-[clamp(9px,3.5cqw,13px)] ${secondary}`}
                >
                  Live at {venue}
                </p>
              </div>
            </>
          ) : null}

          {template === "overview" ? (
            <>
              <p className="line-clamp-3 break-words text-[clamp(20px,9cqw,42px)] font-bold leading-[1.02] tracking-[-0.04em]">
                {title}
              </p>
              <p className={`mt-2 text-[clamp(9px,3.6cqw,14px)] ${secondary}`}>
                {date} · {venue}
              </p>
              <div
                className={`mt-[10%] grid grid-cols-3 border-y py-[7%] text-center ${light ? "border-black/15" : "border-white/20"}`}
              >
                <p>
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {recap.matchCount}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    matches
                  </span>
                </p>
                <p>
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {recap.totalPoints}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    points
                  </span>
                </p>
                <p>
                  <strong className="score block text-[clamp(18px,8cqw,38px)]">
                    {recap.playMinutes || "—"}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    minutes
                  </span>
                </p>
              </div>
            </>
          ) : null}

          {template === "personal" && personal ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                MY GAME
              </p>
              <p className="mt-2 text-[clamp(24px,11cqw,48px)] font-bold leading-none tracking-[-0.045em]">
                {personal.wins}–{personal.losses}
              </p>
              <p className="mt-3 text-[clamp(16px,7cqw,30px)] font-bold leading-tight">
                {personal.name}
              </p>
              <div
                className={`mt-[10%] grid grid-cols-3 border-y py-[6%] text-center ${light ? "border-black/15" : "border-white/20"}`}
              >
                <p>
                  <strong className="score block text-[clamp(16px,7cqw,30px)]">
                    #{personal.rank}
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    standing
                  </span>
                </p>
                <p>
                  <strong className="score block text-[clamp(16px,7cqw,30px)]">
                    <SignedDifference value={personal.differential} />
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    point diff
                  </span>
                </p>
                <p>
                  <strong className="score block text-[clamp(16px,7cqw,30px)]">
                    {Math.round(personal.winPercentage * 100)}%
                  </strong>
                  <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>
                    wins
                  </span>
                </p>
              </div>
            </>
          ) : null}

          {template === "winning-team" && recap.topPair ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                WINNING TEAM
              </p>
              <p className="mt-3 text-[clamp(23px,9cqw,42px)] font-bold leading-[1.02] tracking-[-0.04em]">
                {recap.topPair.names.join(" + ")}
              </p>
              <p className="score mt-[10%] text-[clamp(40px,18cqw,76px)] font-bold leading-none">
                {recap.topPair.wins}
              </p>
              <p className={`mt-1 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                {recap.topPair.wins === 1 ? "win" : "wins"} together ·{" "}
                {recap.topPair.played} played
              </p>
            </>
          ) : null}

          {template === "leader" && recap.standout ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                TOP OF THE TABLE
              </p>
              <p className="mt-3 text-[clamp(24px,10cqw,46px)] font-bold leading-tight tracking-[-0.04em]">
                {recap.standout.name}
              </p>
              <p className="score mt-[10%] text-[clamp(40px,18cqw,76px)] font-bold leading-none">
                {recap.standout.wins}–{recap.standout.losses}
              </p>
              <p className={`mt-2 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                <SignedDifference value={recap.standout.differential} /> point
                difference · {Math.round(recap.standout.winPercentage * 100)}%
                wins
              </p>
            </>
          ) : null}

          {template === "standings" ? (
            <>
              <p className="text-[clamp(20px,8cqw,38px)] font-bold tracking-[-0.035em]">
                Session Standings
              </p>
              <ol
                className={`mt-[7%] divide-y ${light ? "divide-black/15" : "divide-white/20"}`}
              >
                {recap.standings.slice(0, 5).map((row, index) => (
                  <li
                    key={row.playerId}
                    className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 py-[4%] text-[clamp(9px,3.8cqw,15px)]"
                  >
                    <span className={`score ${secondary}`}>{index + 1}</span>
                    <strong className="truncate">{row.name}</strong>
                    <span className="score font-bold">
                      {row.wins}–{row.losses} ·{" "}
                      <SignedDifference value={row.differential} />
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          {template === "closest" && recap.closestMatch ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                CLOSEST FINISH
              </p>
              <p className="score mt-[7%] text-[clamp(42px,19cqw,82px)] font-bold leading-none tracking-[-0.06em]">
                {recap.closestMatch.score}
              </p>
              <div className="mt-[8%] grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[clamp(10px,4cqw,16px)] font-bold leading-tight">
                <p>{recap.closestMatch.teamA.join(" + ")}</p>
                <span className={secondary}>vs</span>
                <p className="text-right">
                  {recap.closestMatch.teamB.join(" + ")}
                </p>
              </div>
              <p
                className={`mt-[8%] text-[clamp(9px,3.6cqw,14px)] ${secondary}`}
              >
                {recap.closestMatch.courtLabel} · {recap.closestMatch.margin}
                -point margin
              </p>
            </>
          ) : null}

          {template === "court" && recap.busiestCourt ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                BUSIEST COURT
              </p>
              <p className="mt-3 text-[clamp(25px,11cqw,48px)] font-bold leading-tight tracking-[-0.04em]">
                {recap.busiestCourt.label}
              </p>
              <p className="score mt-[10%] text-[clamp(44px,19cqw,82px)] font-bold leading-none">
                {recap.busiestCourt.matches}
              </p>
              <p className={`mt-2 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                {recap.busiestCourt.matches === 1 ? "match" : "matches"} played
                here
              </p>
            </>
          ) : null}

          {template === "points" ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                POINTS PLAYED
              </p>
              <p className="score mt-[7%] text-[clamp(48px,22cqw,92px)] font-bold leading-none tracking-[-0.06em]">
                {recap.totalPoints}
              </p>
              <p className={`mt-3 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                across {recap.matchCount}{" "}
                {recap.matchCount === 1 ? "match" : "matches"}
              </p>
            </>
          ) : null}

          {template === "court-time" ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                COURT TIME
              </p>
              <p className="score mt-[7%] text-[clamp(48px,22cqw,92px)] font-bold leading-none tracking-[-0.06em]">
                {recap.playMinutes}
              </p>
              <p className={`mt-3 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                minutes of play together
              </p>
            </>
          ) : null}

          {template === "crew" ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                THE CREW
              </p>
              <p className="mt-3 text-[clamp(23px,9cqw,42px)] font-bold leading-[1.08] tracking-[-0.04em]">
                {recap.standings.map((row) => row.name).join(" · ")}
              </p>
              <p
                className={`mt-[8%] text-[clamp(10px,4cqw,15px)] ${secondary}`}
              >
                {recap.standings.length} players · one game
              </p>
            </>
          ) : null}

          {template === "custom" ? (
            <>
              <p
                className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}
              >
                OUR NIGHT
              </p>
              <p className="mt-3 text-[clamp(26px,11cqw,50px)] font-bold leading-[1.02] tracking-[-0.045em]">
                {customHeadline || title}
              </p>
              <p className={`mt-3 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
                {date} · {venue}
              </p>
            </>
          ) : null}

          {customNote ? (
            <p
              className={`mt-[8%] border-t pt-[5%] text-[clamp(9px,3.7cqw,14px)] font-medium ${light ? "border-black/15" : "border-white/20"}`}
            >
              {customNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
