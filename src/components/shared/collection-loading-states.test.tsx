import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import GamesLoading from "@/app/(app)/games/(list)/loading";
import GroupsLoading from "@/app/(app)/groups/loading";
import NotificationsLoading from "@/app/(app)/notifications/loading";
import NewGameLoading from "@/app/games/new/loading";
import OpenGamesLoading from "@/app/games/open/loading";

afterEach(cleanup);

describe("collection loading boundaries", () => {
  it.each([
    ["Games", GamesLoading],
    ["Open games", OpenGamesLoading],
    ["Groups", GroupsLoading],
    ["Notifications", NotificationsLoading],
  ] as const)("keeps the %s title as real UI", (title, Loading) => {
    render(<Loading />);
    expect(
      screen.getByRole("heading", { name: title, level: 1 })
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("uses the create shell instead of the parent Games fallback", () => {
    render(<NewGameLoading />);
    expect(
      screen.getByRole("heading", { name: "Create a game", level: 1 })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Games", level: 1 })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Create game progress" })
    ).toHaveTextContent("Step 1 of 4");
  });

  it("keeps collection controls real while game rows load", () => {
    render(<OpenGamesLoading />);
    expect(
      screen.getByRole("region", { name: "Open game filters" })
    ).toBeVisible();

    cleanup();
    render(<GamesLoading />);
    const filters = screen.getByRole("group", { name: "Filter games" });
    expect(filters).toHaveTextContent("Upcoming");
    expect(filters).toHaveTextContent("Invites");
    expect(filters).toHaveTextContent("Past");
  });

  it("keeps notification filters real while notifications load", () => {
    render(<NotificationsLoading />);
    const navigation = screen.getByRole("navigation", {
      name: "Notification filters",
    });
    expect(navigation).toHaveTextContent("All");
    expect(navigation).toHaveTextContent("Unread");
  });
});
