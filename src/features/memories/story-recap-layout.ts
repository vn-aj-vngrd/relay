import type { SessionRecap } from "./recap";
import { type RecapShareTemplateId, viewerStanding } from "./recap-share";
import {
  type CopyBlock,
  prepareInvitationBlocks,
  prepareStoryPoster,
} from "./story-framed-invitation";
import {
  type StoryPhotoPlacement,
  type StoryPhotoRole,
  storyScene,
} from "./story-scene";
import {
  type StoryTheme,
  storyMemoryFont,
  storyScoreFont,
} from "./story-theme";

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
          `${recap.matchCount} completed ${plural(recap.matchCount, "match", "matches")}`,
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
          `${recap.matchCount} ${plural(recap.matchCount, "match", "matches")} played`,
          48,
          { weight: 600 }
        ),
        row(
          "points",
          `${recap.totalPoints} ${plural(recap.totalPoints, "point")} played`,
          48,
          {
            weight: 600,
          }
        ),
        row(
          "time",
          recap.playMinutes
            ? `${recap.playMinutes} ${plural(recap.playMinutes, "minute")} of court time`
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
            `${plural(recap.busiestCourt.matches, "match", "matches")} played here`,
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
          `Across ${recap.matchCount} ${plural(recap.matchCount, "match", "matches")}`,
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
          `Across ${recap.matchCount} ${plural(recap.matchCount, "match", "matches")}`,
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
      head = [{ ...heading(input.customHeadline || input.title), size: 104 }];
      body = [
        row(
          "memory-stats",
          `${recap.matchCount} ${plural(recap.matchCount, "match", "matches")} · ${recap.totalPoints} ${plural(recap.totalPoints, "point")} played`,
          38,
          { weight: 600 }
        ),
        ...(personal
          ? [
              row(
                "memory-result",
                `${personal.name} · ${personal.wins}–${personal.losses} wins–losses`,
                34
              ),
            ]
          : []),
      ];
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
  if (input.theme !== "minimal") {
    const bold = input.theme === "court-pop";
    const emphasize = (block: StoryRow): StoryRow => ({
      ...block,
      size:
        block.id === "result"
          ? framed
            ? 144
            : bold
              ? 240
              : 192
          : block.id === "headline"
            ? input.template === "custom"
              ? 104
              : framed
                ? 72
                : bold
                  ? 112
                  : 88
            : block.size,
      weight:
        bold && (block.id === "headline" || block.numeric) ? 900 : block.weight,
    });
    copy.head = copy.head.map(emphasize);
    copy.body = copy.body.map(emphasize);
    if (!framed) {
      // Keep a player's name and record together above the art.
      if (copy.body[0]?.id === "result") {
        copy.head.push(...copy.body.splice(0, 2));
      }
      const poster = prepareStoryPoster(copy.head, copy.body, 1810);
      const blocks = poster.blocks.map((block) => ({
        ...block,
        fontFamily:
          input.template === "custom" && block.id === "headline"
            ? storyMemoryFont(input.theme)
            : block.numeric
              ? storyScoreFont(input.theme)
              : "Inter, Arial, sans-serif",
      }));
      return {
        ...poster,
        blocks,
        separators: recapSeparators(blocks),
      };
    }
  }
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
        fontFamily:
          input.template === "custom" && block.id === "headline"
            ? storyMemoryFont(input.theme)
            : block.numeric
              ? storyScoreFont(input.theme)
              : "Inter, Arial, sans-serif",
      };
      y += block.height;
      return result;
    });
  };
  const bodyHeight = height(prepared.body);
  const bodyTop = framed
    ? scene.facts.y
    : input.theme === "minimal" && !input.hasPhoto
      ? 160 + (1650 - bodyHeight) / 2
      : 1810 - bodyHeight;
  const blocks = [
    ...position(prepared.head, scene.heading?.y ?? 160),
    ...position(prepared.body, bodyTop),
  ];
  return { scene, blocks, separators: recapSeparators(blocks), factor };
}

function recapSeparators(blocks: Array<StoryRow & { y: number; gap: number }>) {
  return blocks.flatMap((block, index) =>
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
}

export function drawStoryRecap(
  context: CanvasRenderingContext2D,
  layout: NonNullable<ReturnType<typeof storyRecapLayout>>,
  foreground: string,
  secondary: string,
  separator: string,
  resultColor = foreground,
  headlineColor = foreground
) {
  context.save();
  context.fillStyle = separator;
  for (const line of layout.separators)
    context.fillRect(line.x, line.y, line.width, line.height);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  for (const block of layout.blocks) {
    context.fillStyle = block.secondary
      ? secondary
      : block.id === "result"
        ? resultColor
        : block.id === "headline"
          ? headlineColor
          : foreground;
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
