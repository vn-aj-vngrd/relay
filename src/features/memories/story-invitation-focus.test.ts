import { describe, expect, it } from "vitest";

import { invitationJoinCaption } from "./recap-share";
import {
  type FramedInvitationInput,
  framedInvitationLayout,
  invitationSeparators,
} from "./story-framed-invitation";
import { storyInvitationLayout } from "./story-invitation-layout";
import { storyJoinText } from "./story-join";

const input: FramedInvitationInput = {
  title: "Sun Night",
  date: "Sunday · 7–9 PM",
  venue: "Community courts",
  invitation: {
    hostName: "Van",
    priceLabel: "₱100",
    goingCount: 3,
    capacity: 8,
    requiresApproval: false,
    waitlistOpen: false,
  },
  template: "invitation",
  customNote: "Bring water",
  theme: "minimal",
  placement: "center",
  joinMode: "qr",
};

for (const [name, layout] of [
  ["framed", framedInvitationLayout],
  ["nonframed", storyInvitationLayout],
] as const) {
  describe(`${name} invitation focus hierarchy`, () => {
    it.each(["invitation", "spots"] as const)(
      "uses grouped spacing without trailing padding for %s",
      (template) => {
        const { blocks, factor } = layout({
          ...input,
          placement: "top",
          template,
        });
        for (const [index, block] of blocks.entries()) {
          const textHeight = block.lines.length * block.size * 1.25;
          const expectedGap =
            index === blocks.length - 1 ? 0 : (block.gapAfter ?? 12) * factor;
          expect(block.height - textHeight).toBeCloseTo(expectedGap);
          if (index < blocks.length - 1) {
            expect(blocks[index + 1].y - block.y).toBeCloseTo(block.height);
          }
        }
        const headline = blocks[0];
        const schedule = blocks.find((block) => block.id === "schedule")!;
        const host = blocks.find((block) => block.id === "host")!;
        expect(headline.size).toBeGreaterThan(schedule.size);
        expect(schedule.size).toBeGreaterThan(host.size);
        expect(host.secondary).toBe(true);
        expect(blocks.find((block) => block.id === "price")!.gap).toBe(
          (template === "invitation" ? 64 : 32) * factor
        );
      }
    );

    it.each(["top", "center", "bottom"] as const)(
      "separates plan and RSVP without intersecting text in %s placement",
      (placement) => {
        const result = layout({ ...input, placement });
        const price = result.blocks.find((block) => block.id === "price")!;
        const going = result.blocks.find((block) => block.id === "going")!;
        const separators = invitationSeparators(result);
        expect(separators).toHaveLength(1);
        const line = separators[0];
        expect(line.x).toBe(price.x);
        expect(line.width).toBe(result.scene.facts.width);
        expect(line.y).toBeGreaterThan(price.y + price.height - price.gap);
        expect(line.y + line.height).toBeLessThan(going.y);
        expect(going.size).toBeGreaterThan(price.size);
      }
    );

    it("leads Invitation with the plan and Who’s in with availability", () => {
      const plan = layout(input).blocks;
      const recruiting = layout({ ...input, template: "spots" }).blocks;
      expect(plan.slice(0, 4).map((block) => block.id)).toEqual([
        "title",
        "schedule",
        "location",
        "price",
      ]);
      expect(recruiting.slice(0, 3).map((block) => block.id)).toEqual([
        "headline",
        "going",
        "title",
      ]);
      expect(recruiting[0].text).toBe("5 spots open");
      expect(recruiting[1].text).toBe("3 of 8 going");
      expect(recruiting[0].size).toBeGreaterThan(recruiting[2].size);
      for (const id of ["schedule", "location", "price", "host", "note"]) {
        expect(recruiting.find((block) => block.id === id)?.text).toBe(
          plan.find((block) => block.id === id)?.text
        );
      }
    });

    it.each([
      {
        goingCount: 7,
        waitlistOpen: false,
        headline: "1 spot open",
        action: "View game and join",
      },
      {
        goingCount: 8,
        waitlistOpen: true,
        headline: "Join the waitlist",
        action: "Join the waitlist",
      },
      {
        goingCount: 8,
        waitlistOpen: false,
        headline: "Game full",
        action: "View game",
      },
      {
        goingCount: 9,
        waitlistOpen: false,
        headline: "Game full",
        action: "View game",
      },
    ])(
      "uses truthful recruitment copy for $headline",
      ({ goingCount, waitlistOpen, headline, action }) => {
        const invitation = {
          ...input.invitation,
          goingCount,
          waitlistOpen,
          requiresApproval: true,
        };
        const result = layout({ ...input, invitation, template: "spots" });
        expect(result.blocks[0].text).toBe(headline);
        expect(
          result.blocks.find((block) => block.id === "availability")?.text
        ).toContain("Host approval required");
        const caption = invitationJoinCaption("spots", invitation, "link");
        expect(caption).toBe(action);
        expect(
          storyJoinText("https://relay.example/s/sun-night", "link", caption)
            .label
        ).toBe(action);
        expect(invitationJoinCaption("invitation", invitation, "link")).toBe(
          "View game and RSVP"
        );
      }
    );
  });
}
