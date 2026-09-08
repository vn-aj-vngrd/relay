import { invitationStateLabel, type StoryInvitationFacts } from "./recap-share";
import { type StoryJoinMode, storyJoinGeometry } from "./story-join";
import { type StoryPhotoPlacement, storyScene } from "./story-scene";
import type { StoryTheme } from "./story-theme";

export type FramedInvitationInput = {
  title: string;
  date: string;
  venue: string;
  invitation: StoryInvitationFacts;
  template: "invitation" | "spots";
  customNote: string;
  theme: StoryTheme;
  placement: StoryPhotoPlacement;
  joinMode: StoryJoinMode;
};

export type CopyBlock = {
  id: string;
  text: string;
  size: number;
  weight: number;
  gapAfter?: number;
  secondary?: boolean;
};

// Conservative advance budget, shared by SSR, preview and export. It deliberately
// wraps sooner than Inter rather than relying on viewport-dependent DOM fitting.
// Wide glyphs and unbroken names are handled without truncation or maxWidth squeeze.
function advance(character: string) {
  if (/\s/.test(character)) return 0.35;
  if (/[ilIjtfr.,:;'!|]/.test(character)) return 0.45;
  if (/[mwMW@%]/.test(character) || (character.codePointAt(0) ?? 0) > 127)
    return 1.05;
  if (/[A-Z]/.test(character)) return 0.9;
  return 0.75;
}

export function wrapStoryCopy(text: string, size: number, width = 936) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    let used = 0;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const wordWidth = Array.from(word).reduce(
        (sum, char) => sum + advance(char) * size,
        0
      );
      if (line && used + size * 0.35 + wordWidth > width) {
        lines.push(line);
        line = "";
        used = 0;
      }
      if (line) {
        line += " ";
        used += size * 0.35;
      }
      for (const char of word) {
        const next = advance(char) * size;
        if (line && used + next > width) {
          lines.push(line);
          line = "";
          used = 0;
        }
        line += char;
        used += next;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function invitationCopyBlocks(
  input: FramedInvitationInput,
  framed: boolean
): { heading: CopyBlock[]; details: CopyBlock[] } {
  const { invitation } = input;
  const title = {
    id: "title",
    text: input.title,
    size: framed ? 72 : 88,
    weight: 700,
    gapAfter: 32,
  };
  const schedule = { id: "schedule", text: input.date, size: 36, weight: 600 };
  const location = { id: "location", text: input.venue, size: 36, weight: 500 };
  const host = {
    id: "host",
    text: `Hosted by ${invitation.hostName}`,
    size: 32,
    weight: 500,
    secondary: true,
  };
  const price = {
    id: "price",
    text: `${invitation.priceLabel} · per player`,
    size: 36,
    weight: 500,
    gapAfter: 32,
  };
  const note = input.customNote
    ? [
        {
          id: "note",
          text: input.customNote,
          size: framed ? 34 : 30,
          weight: 500,
          secondary: true,
        },
      ]
    : [];
  if (input.template === "spots") {
    const spots = Math.max(0, invitation.capacity - invitation.goingCount);
    const full = spots === 0;
    const headline = full
      ? invitation.waitlistOpen
        ? "Join the waitlist"
        : "Game full"
      : `${spots} ${spots === 1 ? "spot" : "spots"} open`;
    const availability = [
      full
        ? invitation.waitlistOpen
          ? "Waitlist open"
          : "No spots available"
        : "RSVP to join",
      ...(invitation.requiresApproval ? ["Host approval required"] : []),
    ].join(" · ");
    return {
      heading: [
        { id: "headline", text: headline, size: framed ? 72 : 88, weight: 700 },
        {
          id: "going",
          text: `${invitation.goingCount} of ${invitation.capacity} going`,
          size: 48,
          weight: 500,
          gapAfter: 36,
        },
      ] satisfies CopyBlock[],
      details: [
        { ...title, size: 48, gapAfter: 12 },
        schedule,
        location,
        price,
        { id: "availability", text: availability, size: 36, weight: 600 },
        host,
        ...note,
      ] satisfies CopyBlock[],
    };
  }
  return {
    heading: [title] satisfies CopyBlock[],
    details: [
      schedule,
      location,
      { ...price, gapAfter: 64 },
      {
        id: "going",
        text: `${invitation.goingCount}/${invitation.capacity} Going`,
        size: 40,
        weight: 600,
      },
      {
        id: "availability",
        text: invitationStateLabel(invitation),
        size: 36,
        weight: 500,
        gapAfter: 32,
      },
      host,
      ...note,
    ] satisfies CopyBlock[],
  };
}

/** One spacing rhythm for both renderers and photo modes: 12px within a
 * group, 32–36px between groups, 64px around the plan/RSVP separator,
 * and no trailing spacer after the last row. */
export function prepareInvitationBlocks<T extends CopyBlock>(
  blocks: T[],
  factor: number,
  width = 936
) {
  return blocks.map((block, index) => {
    const size = block.size * factor;
    const lines = wrapStoryCopy(block.text, size, width);
    const gap =
      index === blocks.length - 1 ? 0 : (block.gapAfter ?? 12) * factor;
    return {
      ...block,
      size,
      lines,
      height: lines.length * size * 1.25 + gap,
      gap,
    };
  });
}

/** Full-width, content-sized rows; only unusually dense copy reduces type after
 * wrapping and exhausting the photo budget. No whole factual-block transform. */
export function framedInvitationLayout(input: FramedInvitationInput) {
  const { placement } = input;
  const { heading, details } = invitationCopyBlocks(input, true);
  const bottom = Math.min(
    1810,
    storyJoinGeometry(input.joinMode).footer.y - 32
  );
  const center = placement === "center";
  const budget = bottom - 160 - 480 - (center ? 64 : 32);
  const prepare = prepareInvitationBlocks;
  let factor = 1;
  let head = prepare(center ? heading : [], factor);
  let body = prepare(center ? details : [...heading, ...details], factor);
  const height = (blocks: typeof head) =>
    blocks.reduce((sum, block) => sum + block.height, 0);
  while (height(head) + height(body) > budget) {
    factor *= 0.96;
    head = prepare(center ? heading : [], factor);
    body = prepare(center ? details : [...heading, ...details], factor);
  }
  const scene = storyScene(input.theme, true, "foreground", placement, true, {
    bottom,
    headingHeight: center ? height(head) : 0,
    factsHeight: height(body) + (center ? 0 : height(head)),
  });
  const position = (blocks: typeof head, start: number) => {
    let y = start;
    return blocks.map((block) => {
      const positioned = {
        ...block,
        x: scene.facts.x,
        y,
        baseline: y + block.size,
      };
      y += block.height;
      return positioned;
    });
  };
  return {
    scene,
    factor,
    blocks: center
      ? [...position(head, scene.heading!.y), ...position(body, scene.facts.y)]
      : position([...head, ...body], scene.facts.y),
  };
}

/** One divider inside the reserved plan/RSVP gap, never through a text row. */
export function invitationSeparators(
  layout: ReturnType<typeof framedInvitationLayout>
) {
  return layout.blocks.flatMap((block, index) => {
    const previous = layout.blocks[index - 1];
    if (block.id !== "going" || previous?.id !== "price") return [];
    return [
      {
        x: layout.scene.facts.x,
        y: block.y - previous.gap / 2,
        width: layout.scene.facts.width,
        height: 2,
      },
    ];
  });
}

export function drawFramedInvitation(
  context: CanvasRenderingContext2D,
  layout: ReturnType<typeof framedInvitationLayout>,
  foreground: string,
  secondary: string,
  separator = secondary
) {
  context.save();
  context.fillStyle = separator;
  for (const line of invitationSeparators(layout)) {
    context.fillRect(line.x, line.y, line.width, line.height);
  }
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  for (const block of layout.blocks) {
    context.fillStyle = block.secondary ? secondary : foreground;
    context.font = `${block.weight} ${block.size}px Inter, Arial, sans-serif`;
    block.lines.forEach((line, index) =>
      context.fillText(
        line,
        block.x,
        block.baseline + index * block.size * 1.25
      )
    );
  }
  context.restore();
}
