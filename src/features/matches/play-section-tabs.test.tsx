import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlaySectionTabs } from "./play-section-tabs";

describe("PlaySectionTabs", () => {
  it("shares one desktop toolbar with stable right-side roster actions", () => {
    render(
      <PlaySectionTabs
        courts={<p>Active courts</p>}
        queue={<p>Waiting players</p>}
        headerActions={<button type="button">Players (8)</button>}
      />
    );
    const players = screen.getByRole("button", { name: "Players (8)" });
    const actions = players.parentElement;
    const tabs = screen.getByRole("group", { name: "Live Play sections" })
      .parentElement?.parentElement;
    expect(actions).toHaveClass("md:order-2", "md:shrink-0");
    expect(tabs).toHaveClass("min-w-0", "md:order-1", "md:flex-1");
    expect(actions?.parentElement).toBe(tabs?.parentElement);
    expect(actions?.parentElement).toHaveClass(
      "flex-col",
      "md:flex-row",
      "md:items-center"
    );
    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
    expect(screen.getByRole("button", { name: "Players (8)" })).toBe(players);
    expect(players).toBeVisible();
  });

  it("defaults to Courts and switches sections with pressed-state controls", () => {
    render(
      <PlaySectionTabs
        courts={<p>Active court content</p>}
        queue={<p>Queue content</p>}
      />
    );

    const courts = screen.getByRole("button", { name: "Courts" });
    const queue = screen.getByRole("button", { name: "Queue" });
    expect(courts).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Active court content")).toBeVisible();
    expect(screen.getByText("Queue content")).not.toBeVisible();

    fireEvent.click(queue);

    expect(queue).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Queue content")).toBeVisible();
    expect(screen.getByText("Active court content")).not.toBeVisible();
  });

  it("only includes optional sections when their content exists", () => {
    const { rerender } = render(
      <PlaySectionTabs
        courts={<p>Courts</p>}
        queue={<p>Queue</p>}
        results={<p>Completed matches</p>}
        standings={<p>Standings table</p>}
      />
    );

    expect(screen.getByRole("button", { name: "Results" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Standings" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Manage" })
    ).not.toBeInTheDocument();

    rerender(
      <PlaySectionTabs
        courts={<p>Courts</p>}
        queue={<p>Queue</p>}
        manage={<p>Management controls</p>}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Results" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Standings" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage" })).toBeVisible();
  });
});
