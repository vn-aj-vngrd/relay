import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { storyThemes } from "@/features/memories/story-theme";
import { RecapTemplatePreview } from "./recap-template-preview";

afterEach(cleanup);

describe("Landing Story examples", () => {
  it("shows all five real themes with matching labels and sample-data disclosure", () => {
    const { container } = render(<RecapTemplatePreview />);
    expect(container.querySelectorAll("[data-story-theme]")).toHaveLength(5);
    for (const theme of storyThemes) {
      expect(screen.getByText(theme.label, { exact: true })).toBeVisible();
      expect(
        container.querySelector(`[data-story-theme="${theme.id}"]`)
      ).not.toBeNull();
    }
    expect(screen.getByText(/Sample game data/)).toBeVisible();
    expect(
      screen.queryByText("Snapshot", { exact: true })
    ).not.toBeInTheDocument();
  });
});
