import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GamePageIntro } from "./game-page-intro";

afterEach(cleanup);

describe("GamePageIntro", () => {
  it.each(["Game settings", "Set up Play"])(
    "keeps a visible title for the standalone %s screen",
    (title) => {
      const { container } = render(<GamePageIntro title={title} showTitle />);
      expect(screen.getByRole("heading", { name: title })).not.toHaveClass(
        "sr-only"
      );
      expect(container.querySelector("header")).not.toBeNull();
      expect(container.querySelector("p")).toBeNull();
    }
  );

  it("reserves no header row when the active tab already names the view", () => {
    const { container } = render(<GamePageIntro title="Overview" />);
    expect(screen.getByRole("heading", { name: "Overview" })).toHaveClass(
      "sr-only"
    );
    expect(container.children).toHaveLength(1);
    expect(container.querySelector(".game-page-intro")).toBeNull();
  });

  it.each([
    "Overview",
    "Players",
    "Play",
    "Recap",
    "Chat",
    "Payments",
    "Story",
  ])(
    "keeps an accessible %s heading while preserving visible contextual actions",
    (title) => {
      const { container } = render(
        <GamePageIntro
          title={title}
          action={<button type="button">Game action</button>}
        />
      );
      expect(
        screen.getByRole("heading", { level: 1, name: title })
      ).toHaveClass("sr-only");
      expect(screen.getByRole("button", { name: "Game action" })).toBeVisible();
      expect(container.querySelector("p")).toBeNull();
    }
  );
});
