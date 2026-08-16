import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ completeProductTour: vi.fn(async () => undefined) }));

import { ProductTour } from "./product-tour";

afterEach(cleanup);

describe("ProductTour", () => {
  it("explains the session workflow in three skippable steps", () => {
    render(<ProductTour />);
    expect(screen.getByRole("heading", { name: "One link carries the plan" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip tour" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Courts stay easy to read" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "The night stays together" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create a game" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Go to Home" })).toBeVisible();
  });
});
