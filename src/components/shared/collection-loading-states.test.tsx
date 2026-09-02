import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import GamesLoading from "@/app/(app)/games/(list)/loading";
import NewGameLoading from "@/app/(app)/games/new/loading";
import OpenGamesLoading from "@/app/(app)/games/open/loading";
import GroupsLoading from "@/app/(app)/groups/loading";
import NotificationsLoading from "@/app/(app)/notifications/loading";

afterEach(cleanup);

describe("collection loading boundaries", () => {
  it.each([
    ["Games", GamesLoading],
    ["Games", OpenGamesLoading],
    ["Groups", GroupsLoading],
    ["Notifications", NotificationsLoading],
  ] as const)("keeps the %s title as real UI", (title, Loading) => {
    render(<Loading />);
    expect(screen.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("uses the create shell instead of the parent Games fallback", () => {
    render(<NewGameLoading />);
    expect(screen.getByRole("heading", { name: "Create a game", level: 1 })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Games", level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Create game progress" })).toHaveTextContent("Step 1 of 4");
  });

  it("keeps Games section tabs real while game rows load", () => {
    render(<OpenGamesLoading />);
    const navigation = screen.getByRole("navigation", { name: "Games sections" });
    expect(navigation).toHaveTextContent("My games");
    expect(navigation).toHaveTextContent("Open games");

    cleanup();
    render(<GamesLoading />);
    const filters = screen.getByRole("group", { name: "Filter games" });
    expect(filters).toHaveTextContent("Upcoming");
    expect(filters).toHaveTextContent("Invites");
    expect(filters).toHaveTextContent("Past");
  });

  it("keeps notification filters real while notifications load", () => {
    render(<NotificationsLoading />);
    const navigation = screen.getByRole("navigation", { name: "Notification filters" });
    expect(navigation).toHaveTextContent("All");
    expect(navigation).toHaveTextContent("Unread");
  });
});
