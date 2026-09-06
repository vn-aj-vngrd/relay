import { createRoot } from "react-dom/client";
import { buildSessionRecap } from "../../src/features/memories/recap";
import { RecapShareCard } from "../../src/features/memories/recap-share-card";
import { RecapStoryCard } from "../../src/features/memories/recap-story-card";
import { storyThemes } from "../../src/features/memories/story-theme";

const players = [
  "Alexandra dela Cruz",
  "Christopher Montgomery",
  "María Gabriela Santos",
  "Jamie Lee",
  "Sam Rivera",
  "Morgan Chen",
  "Taylor Williams",
  "Jordan Robinson",
].map((name, index) => ({ id: String(index), name }));
const recap = buildSessionRecap(
  [0, 1].map((n) => ({
    id: `fixture-${n}`,
    courtLabel: "Synthetic court",
    teamA: [String(n * 4), String(n * 4 + 1)],
    teamB: [String(n * 4 + 2), String(n * 4 + 3)],
    scoreA: 11,
    scoreB: 8,
    status: "completed" as const,
    startedAt: new Date("2026-08-19T10:00:00Z"),
    finishedAt: new Date("2026-08-19T10:12:00Z"),
  })),
  players
);
const props = {
  title: "Saturday with the court crew",
  venue: "Synthetic community court",
  date: "August 19, 2026",
  accent: "#635bde",
  recap,
  viewerPlayerId: "0",
};
const root = document.createElement("main");
root.id = "creative-fixture";
for (const element of document.body.children) {
  if (element instanceof HTMLElement) element.style.display = "none";
}
document.body.append(root);
createRoot(root).render(
  <div style={{ padding: 16 }}>
    <h1>Synthetic Story design fixture — not a real game</h1>
    <RecapShareCard {...props} photos={[]} />
    <div
      id="theme-sheet"
      style={{
        display: "flex",
        gap: 16,
        alignItems: "start",
        width: "max-content",
        padding: 16,
      }}
    >
      {storyThemes.map(({ id, label }) => (
        <section key={id} style={{ width: 280 }}>
          <h2>{label}</h2>
          <RecapStoryCard
            {...props}
            background={{
              id: "pink",
              color: "#f6cfdf",
              light: true,
              label: "Pink",
            }}
            template="standings"
            theme={id}
            layout="center"
          />
        </section>
      ))}
    </div>
    <div
      id="stress-sheet"
      style={{ display: "flex", gap: 16, width: "max-content" }}
    >
      {storyThemes
        .filter(({ id }) => id !== "minimal")
        .flatMap(({ id }) =>
          (["center", "snapshot"] as const).flatMap((layout) =>
            (["crew", "invitation"] as const).map((template) => (
              <section
                key={`${id}-${layout}-${template}`}
                style={{ width: 199 }}
              >
                <h2>
                  {id} {layout} {template}
                </h2>
                <RecapStoryCard
                  {...props}
                  background={{
                    id: "pink",
                    color: "#f6cfdf",
                    light: true,
                    label: "Pink",
                  }}
                  template={template}
                  invitation={{
                    hostName: "Alexandra dela Cruz",
                    priceLabel: "Free",
                    goingCount: 8,
                    capacity: 12,
                    requiresApproval: false,
                    waitlistOpen: false,
                  }}
                  theme={id}
                  layout={layout}
                  phase="live"
                  storyAsOf="September 5 · 10:45 PM · current update"
                />
              </section>
            ))
          )
        )}
    </div>
  </div>
);
