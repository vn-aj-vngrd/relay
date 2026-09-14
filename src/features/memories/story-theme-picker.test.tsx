import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StoryThemePicker } from "./story-theme-picker";

afterEach(cleanup);

describe("StoryThemePicker photo previews", () => {
  it("uses the same selected paper palette as the full story", () => {
    render(
      <StoryThemePicker
        theme="scrapbook"
        accent="#bd4545"
        subject="people"
        onChange={vi.fn()}
      />
    );
    for (const theme of ["Scrapbook", "Coquette", "Court Pop", "Retro Rally"]) {
      expect(
        screen.getByRole("button", { name: theme }).querySelector("svg > path")
      ).toHaveAttribute("fill", "#ffeded");
    }
    expect(
      screen
        .getByRole("button", { name: "Minimal" })
        .querySelector("svg > path")
    ).toHaveAttribute("fill", "#bd4545");
  });
  it("renders device photos as images without SVG URL references", () => {
    const { container } = render(
      <StoryThemePicker
        theme="scrapbook"
        accent="#347571"
        subject="people"
        photoUrl="blob:https://relay.test/photo"
        onChange={vi.fn()}
      />
    );
    expect(container.querySelectorAll("svg image")).toHaveLength(0);
    const photos = container.querySelectorAll("img");
    expect(photos).toHaveLength(5);
    for (const photo of photos) {
      expect(photo).toHaveAttribute("src", "blob:https://relay.test/photo");
      expect(photo).toHaveAttribute("alt", "");
    }
    expect(screen.getByRole("button", { name: "Scrapbook" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps result artwork free of photo overlays", () => {
    const { container } = render(
      <StoryThemePicker
        theme="court-pop"
        accent="#347571"
        subject="result"
        photoUrl="/photo.jpg"
        onChange={vi.fn()}
      />
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
});
