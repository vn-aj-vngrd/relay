import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ completeProductTour: vi.fn(async () => undefined) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

import { ApplicationTour } from "./application-tour";

beforeEach(() => {
  window.history.replaceState({}, "", "/home");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});

function Target({ name }: { name: string }) {
  return <button data-tour={name} ref={(element) => { if (element) element.getBoundingClientRect = () => ({ x: 12, y: 100, top: 100, left: 12, right: 212, bottom: 140, width: 200, height: 40, toJSON: () => ({}) }); }}>{name}</button>;
}

describe("ApplicationTour", () => {
  it("walks through controls in the real application navigation", () => {
    render(<><Target name="create" /><Target name="games" /><Target name="search" /><Target name="notifications" /><Target name="profile" /><ApplicationTour required /></>);

    expect(screen.getByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Start with a game" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Every session stays here" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Find what you already know" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Only useful updates" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Make Relay yours" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Finish tour" })).toBeVisible();
  });

  it("can replay from the tour query without resetting onboarding", async () => {
    window.history.replaceState({}, "", "/home?tour=1");
    render(<ApplicationTour required={false} />);
    expect(await screen.findByRole("dialog", { name: "Welcome to Relay" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close application tour" })).toBeVisible();
  });
});
