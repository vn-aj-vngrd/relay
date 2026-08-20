import Image from "next/image";

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
        aria-label="Memory story template examples"
        tabIndex={0}
        className="flex snap-x snap-mandatory items-center gap-3 overflow-x-auto rounded-xl border border-[#d9d9d4] bg-[#f5f5f2] p-4 outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-[#5962d9]/25 [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-hidden sm:p-5"
      >
        <RecapStoryCard
          {...common}
          template="personal"
          layout="snapshot"
          overlay={46}
          photoPosition={58}
          customNote="Same time next Saturday?"
          viewerPlayerId="van"
          background={{ id: "court-photo", label: "Court photo", imageUrl: "/images/story/pickleball-court.webp" }}
          className="w-full min-w-[190px] snap-center border border-black/10 shadow-[0_4px_8px_rgb(20_24_34_/_0.1)] sm:min-w-0 sm:-rotate-2"
        />
        <RecapStoryCard
          {...common}
          template="winning-team"
          layout="snapshot"
          overlay={62}
          photoPosition={45}
          background={{ id: "paddles", label: "Paddles", imageUrl: "/images/story/paddles-fence.webp" }}
          className="z-10 w-full min-w-[190px] snap-center shadow-[0_5px_10px_rgb(20_24_34_/_0.14)] sm:min-w-0"
        />
        <RecapStoryCard
          {...common}
          template="standings"
          layout="snapshot"
          background={{ id: "ink", label: "Ink", color: "#11131a" }}
          className="w-full min-w-[190px] snap-center border border-white/10 shadow-[0_4px_8px_rgb(20_24_34_/_0.1)] sm:min-w-0 sm:rotate-2"
        />
      </div>
      <div className="mt-3 rounded-xl border border-[#d9d9d4] bg-[#f5f5f2] p-4 text-[#171719]">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-[10px] font-semibold text-[#66666c]">LAYOUT</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[9px] font-semibold">
              <span className="rounded-md border border-[#d9d9d4] py-2">Low</span>
              <span className="rounded-md border border-[#d9d9d4] py-2">Center</span>
              <span className="rounded-md border border-[#d9d9d4] py-2">Poster</span>
              <span className="rounded-md border border-[#5962d9] bg-[#eeedff] py-2 text-[#4f56c9]">Snapshot</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#66666c]">BACKGROUND</p>
            <div className="mt-2 flex gap-2">
              <span className="relative h-9 w-9 overflow-hidden rounded-md border-2 border-[#5962d9]">
                <Image src="/images/story/pickleball-court.webp" alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="relative h-9 w-9 overflow-hidden rounded-md">
                <Image src="/images/story/paddles-fence.webp" alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="h-9 w-9 rounded-md bg-[#18233b]" />
              <span className="h-9 w-9 rounded-md bg-[#b7d62e]" />
              <span className="grid h-9 w-9 place-items-center rounded-md border border-dashed border-[#b9b9b4] text-base text-[#66666c]">
                +
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-[#d9d9d4] pt-4 sm:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex justify-between text-[9px] font-semibold">
              <span>Photo position</span>
              <span className="text-[#66666c]">58%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#deded9]">
              <span className="block h-full w-[58%] rounded-full bg-[#5962d9]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[9px] font-semibold">
              <span>Text contrast</span>
              <span className="text-[#66666c]">46%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#deded9]">
              <span className="block h-full w-[46%] rounded-full bg-[#5962d9]" />
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-[#d9d9d4] bg-white px-3 py-2 text-[10px]">
          <span className="text-[#66666c]">Personal line</span>
          <strong className="ml-2">Same time next Saturday?</strong>
        </div>
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-xs text-[#6b6b70]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#b7d62e]" />
        Choose the focus, layout, background, and words · actual Relay story templates
      </figcaption>
    </figure>
  );
}
