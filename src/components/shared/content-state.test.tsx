import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, LoadingState } from "./content-state";

describe("content states", () => {
  it("explains an empty result and preserves its recovery action", () => {
    const clear = vi.fn();
    render(
      <EmptyState
        icon="search"
        title="No courts match"
        description="Try another neighborhood or clear the active filters."
      >
        <button type="button" onClick={clear}>
          Clear filters
        </button>
      </EmptyState>
    );
    expect(
      screen.getByRole("heading", { name: "No courts match" })
    ).toBeVisible();
    expect(screen.getByText(/Try another neighborhood/)).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(clear).toHaveBeenCalledOnce();
  });

  it("provides visible loading guidance and a single live status", () => {
    render(
      <LoadingState
        label="Opening Quick Play"
        description="Checking for your saved game."
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Opening Quick Play");
    expect(screen.getByText("Checking for your saved game.")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not nest status announcements inside an existing loading region", () => {
    render(
      <div role="status" aria-label="Loading games">
        <LoadingState label="Loading games" compact announce={false} />
      </div>
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByText("Loading games")).toBeVisible();
  });

  it("renders on the server with decorative, reduced-motion-safe loading feedback", () => {
    const html = renderToString(<LoadingState label="Loading games" />);
    expect(html).toContain("Loading games");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("motion-reduce:animate-none");
  });
});
