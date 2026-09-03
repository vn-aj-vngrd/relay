import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ completeProductTour: vi.fn(async () => undefined) }));
vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

import { ApplicationTour } from "./application-tour";

beforeEach(() => {
  window.history.replaceState({}, "", "/home");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});

function Target({ name }: { name: string }) {
  return (
    <button
      data-tour={name}
      ref={(element) => {
        if (element)
          element.getBoundingClientRect = () => ({
            x: 12,
            y: 100,
            top: 100,
            left: 12,
            right: 212,
            bottom: 140,
            width: 200,
            height: 40,
            toJSON: () => ({}),
          });
      }}
    >
      {name}
    </button>
  );
}

describe("ApplicationTour", () => {
  it("does not interrupt a new user who is finishing another task", () => {
    window.history.replaceState({}, "", "/games/new?venue=Central+Pickle");
    render(<ApplicationTour required />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("walks through controls in the real application navigation", () => {
    render(
      <>
        <Target name="create" />
        <Target name="home" />
        <Target name="courts" />
        <Target name="profile" />
        <ApplicationTour required />
      </>,
    );

    expect(screen.getByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Start with a game" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Check your next game" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Find a court" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Open your profile" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create a game" })).toHaveClass("whitespace-nowrap", "shrink-0");
    expect(screen.getByRole("button", { name: "Explore Relay" })).toHaveClass("whitespace-nowrap");
  });

  it("targets the visible responsive navigation control", () => {
    render(
      <>
        <button data-tour="create" style={{ display: "none" }}>
          Hidden desktop create
        </button>
        <Target name="create" />
        <ApplicationTour required />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(document.querySelector<HTMLElement>("[data-tour-spotlight]")).toHaveStyle({ left: "7px", width: "210px" });
  });

  it("preserves a prefilled game destination through the tour", () => {
    const destination = "/games/new?venue=Central+Pickle&address=Cebu+City";
    window.history.replaceState({}, "", `/home?tour=1&next=${encodeURIComponent(destination)}`);
    render(<ApplicationTour required />);

    for (let step = 0; step < 4; step += 1) fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const createButton = screen.getByRole("button", { name: "Create a game" });
    expect(createButton.closest("form")?.querySelector<HTMLInputElement>('input[name="destination"]')).toHaveValue(
      destination,
    );
  });

  it("can replay from the tour query without resetting onboarding", async () => {
    window.history.replaceState({}, "", "/home?tour=1");
    render(<ApplicationTour required={false} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close application tour" })).toBeVisible();
  });
});
