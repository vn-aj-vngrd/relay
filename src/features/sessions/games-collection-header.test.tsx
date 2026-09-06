import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GamesCollectionHeader } from "./games-collection-header";

afterEach(cleanup);
it.each(["Games", "Invitations", "Open games"])(
  "keeps the shared create action available on %s",
  (title) => {
    render(<GamesCollectionHeader title={title} />);
    expect(
      screen.getByRole("heading", { name: title, level: 1 })
    ).toBeVisible();
    const create = screen.getByRole("link", { name: "Create game" });
    expect(create).toHaveAttribute("href", "/games/new");
    expect(create).not.toHaveClass("hidden");
  }
);
