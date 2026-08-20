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
        <Target name="games" />
        <Target name="groups" />
        <Target name="courts" />
        <Target name="search" />
        <Target name="notifications" />
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
    expect(screen.getByRole("dialog", { name: "See all games" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Save regular groups" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Find a court" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Find the plan quickly" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Check updates" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Open your profile" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Finish tour" })).toBeVisible();
  });

  it("can replay from the tour query without resetting onboarding", async () => {
    window.history.replaceState({}, "", "/home?tour=1");
    render(<ApplicationTour required={false} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close application tour" })).toBeVisible();
  });
});
