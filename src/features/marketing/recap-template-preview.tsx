import { buildSessionRecap } from "@/features/memories/recap";
import type { RecapShareTemplateId } from "@/features/memories/recap-share";
import { RecapStoryCard } from "@/features/memories/recap-story-card";
import { type StoryTheme, storyThemes } from "@/features/memories/story-theme";

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
  players
);

const common = {
  title: "Saturday Night Pickle",
  venue: "Central Pickle",
  date: "August 16, 2026",
  accent: "#635bde",
  recap,
};

export function HeroStoryPreview() {
  return (
    <RecapStoryCard
      {...common}
      date="Aug 22, 2026"
      template="winning-team"
      theme="court-pop"
      background={{ id: "ink", label: "Ink", color: "#11131a" }}
      className="w-full"
    />
  );
}

const examples: Array<{
  theme: StoryTheme;
  template: RecapShareTemplateId;
  photo?: string;
  caption?: string;
}> = [
  { theme: "court-pop", template: "overview" },
  { theme: "minimal", template: "personal" },
  {
    theme: "scrapbook",
    template: "custom",
    photo: "/images/story/pickleball-court.webp",
    caption: "Same court next week?",
  },
  {
    theme: "coquette",
    template: "custom",
    photo: "/images/story/paddles-fence.webp",
    caption: "Good games. Better company.",
  },
  { theme: "retro-rally", template: "invitation" },
];

export function RecapTemplatePreview({
  cardsOnly = false,
}: {
  cardsOnly?: boolean;
}) {
  return (
    <figure className="min-w-0">
      <div
        role="region"
        aria-label="Memory story template examples"
        tabIndex={0}
        className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-3 outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
      >
        {examples.map((example) => {
          const theme = storyThemes.find((item) => item.id === example.theme)!;
          return (
            <div
              key={theme.id}
              className="w-[220px] shrink-0 snap-start sm:w-[240px]"
            >
              <RecapStoryCard
                {...common}
                theme={theme.id}
                template={example.template}
                viewerPlayerId="van"
                customHeadline={example.caption}
                showMemoryStats={theme.id !== "coquette"}
                photoRole="foreground"
                photoPlacement="center"
                sceneBackground={{
                  id: "violet",
                  label: "Violet",
                  color: "#635bde",
                }}
                background={
                  example.photo
                    ? {
                        id: theme.id,
                        label: "Example game photo",
                        imageUrl: example.photo,
                      }
                    : { id: "violet", label: "Violet", color: "#635bde" }
                }
                invitation={
                  example.template === "invitation"
                    ? {
                        hostName: "Van",
                        priceLabel: "Free",
                        goingCount: 4,
                        capacity: 8,
                        requiresApproval: false,
                        waitlistOpen: false,
                      }
                    : undefined
                }
                className="w-full"
              />
              <p className="mt-3 text-sm font-semibold">{theme.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {theme.description}
              </p>
            </div>
          );
        })}
      </div>
      {!cardsOnly ? (
        <figcaption className="mt-3 text-xs leading-5 text-muted">
          Sample game data · Real Relay templates. Scroll to explore all five.
          Choose your look, add photos, then share or download.
        </figcaption>
      ) : null}
    </figure>
  );
}
