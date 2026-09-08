import {
  type FramedInvitationInput,
  invitationCopyBlocks,
  prepareInvitationBlocks,
} from "./story-framed-invitation";
import { storyJoinGeometry } from "./story-join";
import { storyScene } from "./story-scene";

/** Nonframed invitations retain the export's large type and full-width rows.
 * Footer modes change only the bottom anchor for ordinary copy. Artwork stays
 * in its original slot; only overflow copy rewraps at smaller type, never via a
 * scene/facts transform. Framed invitations keep their separate photo budget. */
export function storyInvitationLayout(input: FramedInvitationInput) {
  const bottom = Math.min(
    1810,
    storyJoinGeometry(input.joinMode).footer.y - 32
  );
  const scene = storyScene(input.theme, false, "background", "center", true, {
    bottom,
  });
  const { heading, details } = invitationCopyBlocks(input, false);
  const copy = [...heading, ...details];
  const prepare = (factor: number) =>
    prepareInvitationBlocks(copy, factor, scene.facts.width);
  let factor = 1;
  let blocks = prepare(factor);
  const height = () => blocks.reduce((sum, block) => sum + block.height, 0);
  while (height() > scene.facts.height) {
    factor *= 0.96;
    blocks = prepare(factor);
  }
  let y = bottom - height();
  const positioned = blocks.map((block) => {
    const row = { ...block, x: scene.facts.x, y, baseline: y + block.size };
    y += block.height;
    return row;
  });
  return {
    scene,
    factor,
    blocks: positioned,
  };
}

/** Identical brand header coordinates across modes and both renderers. */
export const storyInvitationHeader = {
  x: 112,
  baseline: 94,
  size: 30,
} as const;
