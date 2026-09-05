import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlaySectionTabs } from "./play-section-tabs";

describe("PlaySectionTabs", () => {
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
