import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSessionRecap } from "./recap";
import { RecapShareCard } from "./recap-share-card";

vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: vi.fn(),
}));
afterEach(cleanup);

describe("Photo collage editor", () => {
  const props = {
    title: "Sunday at the kitchen",
    venue: "Court 2",
    date: "September 14",
    accent: "#635bde",
    recap: buildSessionRecap([], []),
    photos: Array.from({ length: 5 }, (_, index) => ({
      id: String(index),
      url: `/moment-${index}.jpg`,
      alt: `Moment ${index + 1}`,
    })),
  };
  it.each(["published", "live", "completed"] as const)(
    "keeps the %s story header limited to Relay branding",
    (phase) => {
      const { container } = render(
        <RecapShareCard {...props} phase={phase} storyAsOf="Updated just now" />
      );
      expect(
        container.querySelector('[data-story-region="header"]')
      ).toHaveTextContent(/^RELAY$/);
    }
  );
  it.each(["Minimal", "Scrapbook", "Coquette", "Court Pop", "Retro Rally"])(
    "applies color changes to the %s story with and without collage photos",
    (theme) => {
      const { container } = render(<RecapShareCard {...props} />);
      for (const withPhotos of [false, true]) {
        if (withPhotos) {
          fireEvent.click(screen.getByRole("button", { name: "Photos" }));
          fireEvent.click(screen.getByRole("button", { name: "Use Moment 1" }));
          fireEvent.click(screen.getByRole("button", { name: "Use Moment 2" }));
        }
        fireEvent.click(screen.getByRole("button", { name: "Look" }));
        fireEvent.click(screen.getByRole("button", { name: theme }));
        fireEvent.click(
          screen.getByRole("button", { name: "Court blue background" })
        );
        expect(container.querySelector("[data-story-theme]")).toHaveStyle({
          backgroundColor: theme === "Minimal" ? "#2563eb" : "#eaf1ff",
        });
        fireEvent.click(
          screen.getByRole("button", { name: "Coral background" })
        );
        expect(container.querySelector("[data-story-theme]")).toHaveStyle({
          backgroundColor: theme === "Minimal" ? "#bd4545" : "#ffeded",
        });
        expect(
          screen.getByRole("button", { name: "Coral background" })
        ).toHaveAttribute("aria-pressed", "true");
      }
    }
  );
  it("groups controls into four compact panels and preserves edits when switching", () => {
    const { container } = render(<RecapShareCard {...props} />);
    const editor = screen.getByRole("group", { name: "Story editor" });
    expect(
      within(editor)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["Photos", "Layout", "Look", "Details"]);
    expect(screen.queryByText("Customize story")).not.toBeInTheDocument();
    expect(container.querySelector("details")).toBeNull();
    fireEvent.click(within(editor).getByRole("button", { name: "Details" }));
    fireEvent.change(screen.getByLabelText("Your caption"), {
      target: { value: "Our Sunday crew" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Personal line/ }), {
      target: { value: "See you next week" },
    });
    expect(
      screen.queryByRole("group", { name: "Story theme" })
    ).not.toBeInTheDocument();
    fireEvent.click(within(editor).getByRole("button", { name: "Look" }));
    expect(screen.queryByLabelText("Your caption")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Court Pop" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Baby Pink background" })
    );
    expect(
      screen.getByRole("button", { name: "Baby Pink background" })
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(editor).getByRole("button", { name: "Photos" }));
    fireEvent.click(screen.getByRole("button", { name: "Use Moment 1" }));
    fireEvent.click(within(editor).getByRole("button", { name: "Layout" }));
    expect(screen.getByRole("group", { name: "Photo role" })).toBeVisible();
    expect(
      screen.queryByRole("group", { name: "Story background" })
    ).not.toBeInTheDocument();
    fireEvent.click(within(editor).getByRole("button", { name: "Details" }));
    expect(screen.getByLabelText("Your caption")).toHaveValue(
      "Our Sunday crew"
    );
    expect(screen.getByRole("textbox", { name: /Personal line/ })).toHaveValue(
      "See you next week"
    );
    expect(container.querySelector("[data-story-theme]")).toHaveAttribute(
      "data-story-theme",
      "court-pop"
    );
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
  });
  it("starts with photos, then preserves four images and individual crops across layout and theme changes", () => {
    const { container } = render(<RecapShareCard {...props} />);
    expect(screen.getByRole("button", { name: "Photos" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByRole("group", { name: "Story theme" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    for (let index = 1; index <= 4; index += 1)
      fireEvent.click(
        screen.getByRole("button", { name: `Use Moment ${index}` })
      );
    expect(screen.getByRole("button", { name: "Use Moment 5" })).toBeDisabled();
    expect(
      container.querySelectorAll('[data-story-region="photo"]')
    ).toHaveLength(4);
    fireEvent.click(
      screen.getByRole("button", { name: "Edit photo 2: Moment 2" })
    );
    fireEvent.change(screen.getByLabelText("Horizontal crop"), {
      target: { value: "75" },
    });
    fireEvent.change(screen.getByLabelText("Photo zoom"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Move earlier" }));
    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
    fireEvent.click(screen.getByRole("button", { name: "Contact sheet" }));
    fireEvent.click(screen.getByRole("button", { name: "Look" }));
    for (const name of [
      "Court Pop",
      "Minimal",
      "Coquette",
      "Retro Rally",
      "Scrapbook",
    ]) {
      fireEvent.click(
        within(screen.getByRole("group", { name: "Story theme" })).getByRole(
          "button",
          { name }
        )
      );
      const images = container.querySelectorAll('[data-story-region="photo"]');
      expect(images).toHaveLength(4);
      expect(images[0]).toHaveAttribute("data-photo-id", "photo:1");
      expect(images[0].querySelector("img")).toHaveStyle({
        objectPosition: "75% 50%",
        transform: "scale(2)",
      });
    }
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled();
  });
  it("returns to a poster and then the empty placeholder as photos are removed", () => {
    const { container } = render(<RecapShareCard {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Use Moment 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Use Moment 2" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Edit photo 1: Moment 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(
      container.querySelectorAll('[data-story-region="photo"]')
    ).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Use Moment 5" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Use Moment 2" }));
    expect(
      screen.getByRole("button", { name: "Add your photo to this memory" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeDisabled();
  });
});
