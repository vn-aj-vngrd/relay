import type { SessionRecap } from "./recap";
import { type RecapShareTemplateId, viewerStanding } from "./recap-share";
import {
  type CopyBlock,
  prepareInvitationBlocks,
} from "./story-framed-invitation";
import {
  type StoryPhotoPlacement,
  type StoryPhotoRole,
  storyScene,
} from "./story-scene";
import { type StoryTheme, storyScoreFont } from "./story-theme";

export type RecapStoryInput = {
  template: RecapShareTemplateId;
  title: string;
  date: string;
  venue: string;
  recap: SessionRecap;
  viewerPlayerId?: string | null;
  courtCount: number;
  customHeadline: string;
  customNote: string;
  theme: StoryTheme;
  hasPhoto: boolean;
  photoRole: StoryPhotoRole;
  photoPlacement: StoryPhotoPlacement;
};

type StoryRow = CopyBlock & { numeric?: boolean; separatorBefore?: boolean };
const row = (
  id: string,
  text: string,
  size = 36,
  extra: Partial<StoryRow> = {}
): StoryRow => ({
  id,
  text,
  size,
  weight: 500,
  ...extra,
});
const heading = (text: string) =>
  row("headline", text, 72, { weight: 700, gapAfter: 32 });
const number = (text: string) =>
  row("result", text, 144, { numeric: true, weight: 700, gapAfter: 12 });
const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`;
const plural = (count: number, singular: string, multiple = `${singular}s`) =>
  count === 1 ? singular : multiple;

/** Each story has one focal result, practical supporting rows, then session
 * context. Names never truncate, and zero values remain facts rather than wins. */
function recapCopy(input: RecapStoryInput) {
  const { recap, template } = input;
  const personal = viewerStanding(recap, input.viewerPlayerId);
  let head: StoryRow[] = [];
  let body: StoryRow[] = [];
  let titleInHeading = false;
  switch (template) {
    case "live":
      head = [heading(input.title)];
      titleInHeading = true;
      body = [
        row("focus", "We’re playing", 48, { weight: 600, gapAfter: 32 }),
        row(
          "matches",
          `${recap.matchCount} completed ${plural(recap.matchCount, "match")}`,
          48,
          { weight: 600 }
        ),
        row(
          "courts",
          `${input.courtCount} planned ${plural(input.courtCount, "court")}`
        ),
      ];
      break;
    case "live-pulse":
      head = [
        number(String(recap.matchCount)),
        row(
          "focus",
          plural(
            recap.matchCount,
            "match complete at this snapshot",
            "matches complete at this snapshot"
          ),
          40
        ),
      ];
      body = [
        row("snapshot", "Play is still underway", 36, { secondary: true }),
      ];
      break;
    case "overview":
      head = [heading(input.title)];
      titleInHeading = true;
      body = [
        row("focus", "Night recap", 48, { weight: 600, gapAfter: 32 }),
        row(
          "matches",
          `${recap.matchCount} ${plural(recap.matchCount, "match")} played`,
          48,
          { weight: 600 }
        ),
        row("points", `${recap.totalPoints} points played`, 48, {
          weight: 600,
        }),
        row(
          "time",
          recap.playMinutes
            ? `${recap.playMinutes} minutes of court time`
            : "Court time not recorded"
        ),
      ];
      break;
    case "personal":
      if (personal) {
        head = [heading(personal.name)];
        body = [
          number(`${personal.wins}–${personal.losses}`),
          row("record-label", "My game · wins–losses", 36, { gapAfter: 32 }),
          row("rank", `#${personal.rank} in this session`),
          row(
            "difference",
            `${signed(personal.differential)} point difference`
          ),
          row("win-rate", `${Math.round(personal.winPercentage * 100)}% wins`),
        ];
      }
      break;
    case "winning-team":
      if (recap.topPair) {
        head = [heading(recap.topPair.names.join(" + "))];
        body = [
          number(String(recap.topPair.wins)),
          row(
            "record-label",
            `${plural(recap.topPair.wins, "win")} together · ${recap.topPair.played} played`,
            40
          ),
          row("focus", "Winning team", 36, { secondary: true }),
        ];
      }
      break;
    case "leader":
      if (recap.standout) {
        head = [heading(recap.standout.name)];
        body = [
          number(`${recap.standout.wins}–${recap.standout.losses}`),
          row("record-label", "Top of the table · wins–losses", 36, {
            gapAfter: 32,
          }),
          row(
            "difference",
            `${signed(recap.standout.differential)} point difference`
          ),
          row(
            "win-rate",
            `${Math.round(recap.standout.winPercentage * 100)}% wins`
          ),
        ];
      }
      break;
    case "standings":
      head = [heading("Session Standings")];
      body = [
        ...(recap.standings.length > 5
          ? [
              row(
                "coverage",
                `Top 5 of ${recap.standings.length} players`,
                32,
                { secondary: true, gapAfter: 24 }
              ),
            ]
          : []),
        ...recap.standings
          .slice(0, 5)
          .flatMap((player, index) => [
            row(
              `player-${player.playerId}`,
              `${index + 1}. ${player.name}`,
              40,
              { weight: 600, gapAfter: 8 }
            ),
            row(
              `record-${player.playerId}`,
              `${player.wins}–${player.losses} wins–losses · ${signed(player.differential)} point diff`,
              32,
              { secondary: true, gapAfter: 24 }
            ),
          ]),
      ];
      break;
    case "closest":
      if (recap.closestMatch) {
        head = [
          number(recap.closestMatch.score),
          row("focus", "Closest finish", 40, { weight: 600 }),
        ];
        body = [
          row("team-a", recap.closestMatch.teamA.join(" + "), 44, {
            weight: 600,
          }),
          row("versus", "vs", 32, { secondary: true }),
          row("team-b", recap.closestMatch.teamB.join(" + "), 44, {
            weight: 600,
            gapAfter: 32,
          }),
          row(
            "margin",
            `${recap.closestMatch.courtLabel} · ${recap.closestMatch.margin}-point margin`
          ),
        ];
      }
      break;
    case "court":
      if (recap.busiestCourt) {
        head = [heading(recap.busiestCourt.label)];
        body = [
          number(String(recap.busiestCourt.matches)),
          row(
            "record-label",
            `${plural(recap.busiestCourt.matches, "match")} played here`,
            40
          ),
          row("focus", "Busiest court", 36, { secondary: true }),
        ];
      }
      break;
    case "points":
      head = [
        number(String(recap.totalPoints)),
        row("focus", "Points played", 40, { weight: 600 }),
      ];
      body = [
        row(
          "matches",
          `Across ${recap.matchCount} ${plural(recap.matchCount, "match")}`,
          40
        ),
      ];
      break;
    case "court-time":
      head = [
        number(String(recap.playMinutes)),
        row("focus", "Minutes of court time", 40, { weight: 600 }),
      ];
      body = [
        row(
          "matches",
          `Across ${recap.matchCount} ${plural(recap.matchCount, "match")}`,
          40
        ),
      ];
      break;
    case "crew":
      head = [heading("The crew")];
      body = [
        row(
          "players",
          `${recap.standings.length} ${plural(recap.standings.length, "player")} · one game`,
          36,
          { secondary: true, gapAfter: 24 }
        ),
        ...recap.standings.map((player) =>
          row(`player-${player.playerId}`, player.name, 44, { weight: 600 })
        ),
      ];
      break;
    case "custom":
      head = [{ ...heading(input.customHeadline || input.title), size: 88 }];
      titleInHeading =
        !input.customHeadline || input.customHeadline === input.title;
      break;
    default:
      break;
  }
  if (!head.length) {
    head = [heading(input.title)];
    titleInHeading = true;
    body = [
      row("unavailable", "No result available for this story", 36, {
        secondary: true,
      }),
    ];
  }
  // One section break marks session context; never boxes around each fact.
  const context = [
    ...(!titleInHeading ? [row("game", input.title, 44, { weight: 600 })] : []),
    row("schedule", input.date, 36, { weight: 600 }),
    row("location", input.venue, 36, { gapAfter: input.customNote ? 32 : 12 }),
    ...(input.customNote
      ? [row("note", input.customNote, 36, { gapAfter: 0 })]
      : []),
  ];
  if (body.length) {
    body[body.length - 1] = { ...body[body.length - 1], gapAfter: 64 };
    context[0] = { ...context[0], separatorBefore: true };
  }
  return { head, body: [...body, ...context] };
}

/** Shared canonical rows replace independent CSS/Canvas shrinking. The photo
 * gets the remaining space, down to 480px, before dense copy rewraps smaller. */
export function storyRecapLayout(input: RecapStoryInput) {
  if (input.template === "invitation" || input.template === "spots")
    return null;
  const copy = recapCopy(input);
  const framed = input.hasPhoto && input.photoRole === "foreground";
  const center = framed && input.photoPlacement === "center";
  const initialScene = storyScene(
    input.theme,
    input.hasPhoto,
    input.photoRole,
    input.photoPlacement,
    true,
    { bottom: 1810 }
  );
  const budget = framed
    ? 1810 - 160 - 480 - (center ? 64 : 32)
    : initialScene.facts.height;
  let factor = 1;
  const prepare = () => ({
    head: prepareInvitationBlocks(center ? copy.head : [], factor),
    body: prepareInvitationBlocks(
      center ? copy.body : [...copy.head, ...copy.body],
      factor
    ),
  });
  let prepared = prepare();
  const height = (blocks: typeof prepared.body) =>
    blocks.reduce((sum, block) => sum + block.height, 0);
  while (height(prepared.head) + height(prepared.body) > budget) {
    factor *= 0.96;
    prepared = prepare();
  }
  const scene = framed
    ? storyScene(
        input.theme,
        true,
        input.photoRole,
        input.photoPlacement,
        true,
        {
          bottom: 1810,
          headingHeight: height(prepared.head),
          factsHeight: height(prepared.body),
        }
      )
    : initialScene;
  const position = (blocks: typeof prepared.body, start: number) => {
    let y = start;
    return blocks.map((block) => {
      const result = {
        ...block,
        x: 72,
        y,
        baseline: y + block.size,
        fontFamily: block.numeric
          ? storyScoreFont(input.theme)
          : "Inter, Arial, sans-serif",
      };
      y += block.height;
      return result;
    });
  };
  const blocks = [
    ...position(prepared.head, scene.heading?.y ?? 160),
    ...position(
      prepared.body,
      framed ? scene.facts.y : 1810 - height(prepared.body)
    ),
  ];
  const separators = blocks.flatMap((block, index) =>
    block.separatorBefore && index > 0
      ? [
          {
            x: 72,
            y: block.y - blocks[index - 1].gap / 2,
            width: 936,
            height: 2,
          },
        ]
      : []
  );
  return { scene, blocks, separators, factor };
}

export function drawStoryRecap(
  context: CanvasRenderingContext2D,
  layout: NonNullable<ReturnType<typeof storyRecapLayout>>,
  foreground: string,
  secondary: string,
  separator: string
) {
  context.save();
  context.fillStyle = separator;
  for (const line of layout.separators)
    context.fillRect(line.x, line.y, line.width, line.height);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  for (const block of layout.blocks) {
    context.fillStyle = block.secondary ? secondary : foreground;
    context.font = `${block.weight} ${block.size}px ${block.fontFamily}`;
    block.lines.forEach((text, index) =>
      context.fillText(
        text,
        block.x,
        block.baseline + index * block.size * 1.25
      )
    );
  }
  context.restore();
}
