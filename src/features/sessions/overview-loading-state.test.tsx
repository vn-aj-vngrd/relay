import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameLifecycleProvider } from "./game-lifecycle-context";
import { OverviewLoadingState } from "./overview-loading-state";

describe("OverviewLoadingState", () => {
  it.each([false, true])(
    "uses completion geometry without an RSVP fallback (shared: %s)",
    (shared) => {
      render(
        <GameLifecycleProvider value="completed">
          <OverviewLoadingState shared={shared}>
            <div>RSVP fallback</div>
          </OverviewLoadingState>
        </GameLifecycleProvider>
      );
      expect(screen.queryByText("RSVP fallback")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Overview" })).toHaveClass(
        "sr-only"
      );
      expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("heading", { name: "Game ended" })).toBeVisible();
      expect(
        screen.getByText("Joining is closed. View the recap for this game.")
      ).toBeVisible();
      const card = screen.getByRole("article");
      const roster = screen.getByRole("region", { name: "Final roster" });
      expect(card.contains(roster)).toBe(shared);
      if (!shared)
        expect(screen.getByRole("complementary")).toContainElement(roster);
      expect(
        screen.getAllByRole("heading", { name: "Final roster" })
      ).toHaveLength(1);
      // The reused activity skeleton reserves precisely the three actual destinations.
      const activity = card.querySelector("section.pt-7");
      expect(activity?.querySelectorAll(".min-h-16")).toHaveLength(3);
      if (shared) {
        expect(activity?.nextElementSibling).toBe(roster);
        expect(
          within(card).getByRole("region", { name: "Final roster" })
        ).toHaveClass("public-session-section");
      }
    }
  );

  it.each(["published", "live", "cancelled"] as const)(
    "preserves the existing %s fallback",
    (status) => {
      render(
        <GameLifecycleProvider value={status}>
          <OverviewLoadingState>
            <div>Existing fallback</div>
          </OverviewLoadingState>
        </GameLifecycleProvider>
      );
      expect(screen.getByText("Existing fallback")).toBeVisible();
    }
  );
});
