import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GamePageIntro } from "./game-page-intro";

afterEach(cleanup);

describe("GamePageIntro", () => {
  it("renders a title without reserving space for a missing subtitle", () => {
    const { container } = render(<GamePageIntro title="Game settings" />);
    expect(
      screen.getByRole("heading", { name: "Game settings" })
    ).toBeVisible();
    expect(container.querySelector("p")).toBeNull();
  });

  it("preserves descriptions on other game surfaces", () => {
    render(<GamePageIntro title="Players" description="Your crew" />);
    expect(screen.getByText("Your crew")).toBeVisible();
  });
});
