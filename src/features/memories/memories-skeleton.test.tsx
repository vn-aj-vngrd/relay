import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MemoriesSkeleton } from "./memories-skeleton";

afterEach(cleanup);

describe("MemoriesSkeleton", () => {
  it("announces loading without exposing placeholder controls", () => {
    render(<MemoriesSkeleton />);
    expect(
      screen.getByRole("status", { name: "Loading session story" })
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading your story editor…")).toHaveClass(
      "sr-only"
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("preserves the editor introduction and section labels while data loads", () => {
    render(<MemoriesSkeleton />);
    expect(
      screen.getByRole("heading", { name: "Make it your memory" })
    ).toBeVisible();
    expect(
      screen.getByText("Pick your moments. Make them yours.")
    ).toBeVisible();
    expect(screen.getByText("Details")).toBeVisible();
    expect(screen.queryByText("Customize story")).not.toBeInTheDocument();
    expect(screen.queryByText("Enlarge preview")).not.toBeInTheDocument();
  });
});
