import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionHero } from "./session-summary";

const longTitle = "dasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadada";

describe("SessionHero", () => {
  it("truncates a long game title without removing its accessible text", () => {
    render(
      <SessionHero
        session={{ startsAt: new Date("2026-08-04T19:00:00+08:00"), title: longTitle }}
        hostLabel="Hosted by you"
      />,
    );

    const heading = screen.getByRole("heading", { name: longTitle });
    expect(heading).toHaveClass("truncate");
    expect(heading).toHaveAttribute("title", longTitle);
  });
});
