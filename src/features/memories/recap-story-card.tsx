import Image from "next/image";

import type { SessionRecap } from "./recap";
import { type RecapShareTemplateId, viewerStanding } from "./recap-share";

export type RecapBackground = {
  id: string;
  label: string;
  color?: string;
  imageUrl?: string;
  light?: boolean;
};

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
  accent,
  recap,
  template,
  background,
  viewerPlayerId,
  className = "",
}: {
  title: string;
  venue: string;
  date: string;
  accent: string;
  recap: SessionRecap;
  template: RecapShareTemplateId;
  background: RecapBackground;
  viewerPlayerId?: string | null;
  className?: string;
}) {
  const personal = viewerStanding(recap, viewerPlayerId);
  const light = Boolean(background.light) && !background.imageUrl;
  const foreground = light ? "text-[#17181d]" : "text-white";
  const secondary = light ? "text-[#17181d]/70" : "text-white/65";

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
          <Image src={background.imageUrl} alt="" fill sizes="240px" className="-z-20 object-cover" />
          <span className="absolute inset-0 -z-10 bg-black/55" aria-hidden />
        </>
      ) : null}
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-[7%] text-[clamp(8px,3.4cqw,12px)] font-bold tracking-[0.08em]">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        RELAY · SESSION RECAP
      </div>
      <div className="absolute inset-x-0 bottom-0 p-[7%]">
        {template === "overview" ? (
          <>
            <p className="text-[clamp(20px,9cqw,42px)] font-bold leading-[1.02] tracking-[-0.04em]">{title}</p>
            <p className={`mt-2 text-[clamp(9px,3.6cqw,14px)] ${secondary}`}>
              {date} · {venue}
            </p>
            <div
              className={`mt-[10%] grid grid-cols-3 border-y py-[7%] text-center ${light ? "border-black/15" : "border-white/20"}`}
            >
              <p>
                <strong className="score block text-[clamp(18px,8cqw,38px)]">{recap.matchCount}</strong>
                <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>matches</span>
              </p>
              <p>
                <strong className="score block text-[clamp(18px,8cqw,38px)]">{recap.totalPoints}</strong>
                <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>points</span>
              </p>
              <p>
                <strong className="score block text-[clamp(18px,8cqw,38px)]">{recap.playMinutes || "—"}</strong>
                <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>minutes</span>
              </p>
            </div>
          </>
        ) : null}

        {template === "personal" && personal ? (
          <>
            <p className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}>MY GAME</p>
            <p className="mt-2 text-[clamp(24px,11cqw,48px)] font-bold leading-none tracking-[-0.045em]">
              {personal.wins}–{personal.losses}
            </p>
            <p className="mt-3 text-[clamp(16px,7cqw,30px)] font-bold leading-tight">{personal.name}</p>
            <div
              className={`mt-[10%] grid grid-cols-3 border-y py-[6%] text-center ${light ? "border-black/15" : "border-white/20"}`}
            >
              <p>
                <strong className="score block text-[clamp(16px,7cqw,30px)]">#{personal.rank}</strong>
                <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>standing</span>
              </p>
              <p>
                <strong className="score block text-[clamp(16px,7cqw,30px)]">
                  <SignedDifference value={personal.differential} />
                </strong>
                <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>point diff</span>
              </p>
              <p>
                <strong className="score block text-[clamp(16px,7cqw,30px)]">
                  {Math.round(personal.winPercentage * 100)}%
                </strong>
                <span className={`text-[clamp(8px,3cqw,12px)] ${secondary}`}>wins</span>
              </p>
            </div>
          </>
        ) : null}

        {template === "winning-team" && recap.topPair ? (
          <>
            <p className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}>WINNING TEAM</p>
            <p className="mt-3 text-[clamp(23px,9cqw,42px)] font-bold leading-[1.02] tracking-[-0.04em]">
              {recap.topPair.names.join(" + ")}
            </p>
            <p className="score mt-[10%] text-[clamp(40px,18cqw,76px)] font-bold leading-none">{recap.topPair.wins}</p>
            <p className={`mt-1 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
              {recap.topPair.wins === 1 ? "win" : "wins"} together · {recap.topPair.played} played
            </p>
          </>
        ) : null}

        {template === "leader" && recap.standout ? (
          <>
            <p className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}>TOP OF THE TABLE</p>
            <p className="mt-3 text-[clamp(24px,10cqw,46px)] font-bold leading-tight tracking-[-0.04em]">
              {recap.standout.name}
            </p>
            <p className="score mt-[10%] text-[clamp(40px,18cqw,76px)] font-bold leading-none">
              {recap.standout.wins}–{recap.standout.losses}
            </p>
            <p className={`mt-2 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
              <SignedDifference value={recap.standout.differential} /> point difference ·{" "}
              {Math.round(recap.standout.winPercentage * 100)}% wins
            </p>
          </>
        ) : null}

        {template === "standings" ? (
          <>
            <p className="text-[clamp(20px,8cqw,38px)] font-bold tracking-[-0.035em]">Session Standings</p>
            <ol className={`mt-[7%] divide-y ${light ? "divide-black/15" : "divide-white/20"}`}>
              {recap.standings.slice(0, 5).map((row, index) => (
                <li
                  key={row.playerId}
                  className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 py-[4%] text-[clamp(9px,3.8cqw,15px)]"
                >
                  <span className={`score ${secondary}`}>{index + 1}</span>
                  <strong className="truncate">{row.name}</strong>
                  <span className="score font-bold">
                    {row.wins}–{row.losses} · <SignedDifference value={row.differential} />
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {template === "closest" && recap.closestMatch ? (
          <>
            <p className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}>CLOSEST FINISH</p>
            <p className="score mt-[7%] text-[clamp(42px,19cqw,82px)] font-bold leading-none tracking-[-0.06em]">
              {recap.closestMatch.score}
            </p>
            <div className="mt-[8%] grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[clamp(10px,4cqw,16px)] font-bold leading-tight">
              <p>{recap.closestMatch.teamA.join(" + ")}</p>
              <span className={secondary}>vs</span>
              <p className="text-right">{recap.closestMatch.teamB.join(" + ")}</p>
            </div>
            <p className={`mt-[8%] text-[clamp(9px,3.6cqw,14px)] ${secondary}`}>
              {recap.closestMatch.courtLabel} · {recap.closestMatch.margin}-point margin
            </p>
          </>
        ) : null}

        {template === "court" && recap.busiestCourt ? (
          <>
            <p className={`text-[clamp(9px,3.5cqw,13px)] font-semibold ${secondary}`}>BUSIEST COURT</p>
            <p className="mt-3 text-[clamp(25px,11cqw,48px)] font-bold leading-tight tracking-[-0.04em]">
              {recap.busiestCourt.label}
            </p>
            <p className="score mt-[10%] text-[clamp(44px,19cqw,82px)] font-bold leading-none">
              {recap.busiestCourt.matches}
            </p>
            <p className={`mt-2 text-[clamp(10px,4cqw,15px)] ${secondary}`}>
              {recap.busiestCourt.matches === 1 ? "match" : "matches"} played here
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
