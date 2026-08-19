import { buildSessionRecap } from "@/features/memories/recap";
import { RecapStoryCard } from "@/features/memories/recap-story-card";

const players = [
  { id: "van", name: "Van" },
  { id: "aj", name: "AJ" },
  { id: "mika", name: "Mika" },
  { id: "bea", name: "Bea" },
];
const recap = buildSessionRecap(
  [
    {
      id: "one",
      courtLabel: "Court 1",
      teamA: ["van", "aj"],
      teamB: ["mika", "bea"],
      scoreA: 11,
      scoreB: 8,
      status: "completed",
      startedAt: new Date("2026-08-16T19:00:00+08:00"),
      finishedAt: new Date("2026-08-16T19:14:00+08:00"),
    },
    {
      id: "two",
      courtLabel: "Court 2",
      teamA: ["van", "mika"],
      teamB: ["aj", "bea"],
      scoreA: 12,
      scoreB: 10,
      status: "completed",
      startedAt: new Date("2026-08-16T19:18:00+08:00"),
      finishedAt: new Date("2026-08-16T19:34:00+08:00"),
    },
    {
      id: "three",
      courtLabel: "Court 1",
      teamA: ["van", "aj"],
      teamB: ["mika", "bea"],
      scoreA: 11,
      scoreB: 6,
      status: "completed",
      startedAt: new Date("2026-08-16T19:38:00+08:00"),
      finishedAt: new Date("2026-08-16T19:52:00+08:00"),
    },
  ],
  players,
);

const common = {
  title: "Saturday Night Pickle",
  venue: "Central Pickle",
  date: "August 16, 2026",
  accent: "#635bde",
  recap,
};

export function RecapTemplatePreview() {
  return (
    <figure className="min-w-0">
      <div
        role="region"
        aria-label="Recap story template examples"
        tabIndex={0}
        className="flex snap-x snap-mandatory items-center gap-3 overflow-x-auto rounded-xl border border-[#d9d9d4] bg-[#f5f5f2] p-4 outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-[#5962d9]/25 [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-hidden sm:p-5"
      >
        <RecapStoryCard
          {...common}
          template="personal"
          viewerPlayerId="van"
          background={{ id: "paper", label: "Paper", color: "#f4f3ef", light: true }}
          className="w-full min-w-[190px] snap-center border border-black/10 shadow-[0_4px_8px_rgb(20_24_34_/_0.1)] sm:min-w-0 sm:-rotate-2"
        />
        <RecapStoryCard
          {...common}
          template="winning-team"
          background={{ id: "court", label: "Court", color: "#18233b" }}
          className="z-10 w-full min-w-[190px] snap-center shadow-[0_5px_10px_rgb(20_24_34_/_0.14)] sm:min-w-0"
        />
        <RecapStoryCard
          {...common}
          template="standings"
          background={{ id: "ink", label: "Ink", color: "#11131a" }}
          className="w-full min-w-[190px] snap-center border border-white/10 shadow-[0_4px_8px_rgb(20_24_34_/_0.1)] sm:min-w-0 sm:rotate-2"
        />
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-xs text-[#6b6b70]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#b7d62e]" />
        Choose the story, background, and stat worth sharing · actual Relay templates
      </figcaption>
    </figure>
  );
}
