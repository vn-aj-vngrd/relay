import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionHero } from "./session-summary";

const longTitle =
  "dasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadadadasdadada";

describe("SessionHero", () => {
  it("keeps a long game title readable and allows it to wrap on mobile", () => {
    render(
      <SessionHero
        session={{
          startsAt: new Date("2026-08-04T19:00:00+08:00"),
          title: longTitle,
        }}
        hostLabel="Hosted by you"
      />
    );

    const heading = screen.getByRole("heading", { name: longTitle });
    expect(heading).toHaveClass(
      "break-words",
      "text-[1.625rem]",
      "sm:text-4xl"
    );
    expect(heading).not.toHaveClass("truncate");
    expect(heading).not.toHaveAttribute("title");
    expect(screen.getByText("Hosted by you")).toHaveClass("truncate");
  });
});

describe("SessionHero lifecycle placement", () => {
  it("opts in to one chip between the game name and host, outside the heading", () => {
    render(
      <SessionHero
        session={{ startsAt: new Date("2026-08-04"), title: "Friday crew" }}
        lifecycle={{ status: "completed", endsAt: "2026-08-05" }}
        hostLabel="Hosted by Alex"
        headingLevel="h2"
      />
    );
    const heading = screen.getByRole("heading", { name: "Friday crew" });
    const chip = screen.getByText("Ended");
    expect(heading.nextElementSibling).toContainElement(chip);
    expect(chip.parentElement?.nextElementSibling).toHaveTextContent(
      "Hosted by Alex"
    );
    expect(heading).not.toHaveTextContent("Ended");
    expect(screen.getAllByText("Ended")).toHaveLength(1);
  });

  it("leaves marketing and other non-opted-in heroes without a lifecycle row", () => {
    const { container } = render(
      <SessionHero
        session={{ startsAt: new Date("2026-08-04"), title: "Preview game" }}
        hostLabel="Hosted by Mika"
      />
    );
    expect(container.querySelector(".rounded-full")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Preview game" }).nextElementSibling
    ).toHaveTextContent("Hosted by Mika");
  });
});
