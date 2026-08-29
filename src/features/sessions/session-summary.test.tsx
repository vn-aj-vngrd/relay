import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionHero } from "./session-summary";

const longTitle = "dasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadada";

describe("SessionHero", () => {
  it("keeps a long game title readable and allows it to wrap on mobile", () => {
    render(
      <SessionHero
        session={{ startsAt: new Date("2026-08-04T19:00:00+08:00"), title: longTitle }}
        hostLabel="Hosted by you"
      />,
    );

    const heading = screen.getByRole("heading", { name: longTitle });
    expect(heading).toHaveClass("break-words", "text-[1.75rem]");
    expect(heading).not.toHaveClass("truncate");
    expect(heading).toHaveAttribute("title", longTitle);
    expect(screen.getByText("Hosted by you")).toHaveClass("truncate");
  });
});
