import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { GroupCollection, type GroupCollectionItem } from "./group-collection";

const items: GroupCollectionItem[] = [{
  id: "group-1",
  href: "/groups/tuesday-dink-club",
  name: "Tuesday Dink Club",
  initials: "TU",
  memberCount: 8,
  role: "owner",
  nextGameDate: "Sat, Aug 22",
  accentColor: "violet",
}];

describe("GroupCollection", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to a scannable list and switches to a persistent grid", () => {
    render(<GroupCollection items={items} />);

    expect(screen.getByTestId("groups-list")).toBeVisible();
    expect(screen.getByRole("link", { name: /Tuesday Dink Club/ })).toHaveAttribute("href", "/groups/tuesday-dink-club");

    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByTestId("groups-grid")).toBeVisible();
    expect(localStorage.getItem("relay-groups-view")).toBe("grid");
  });

  it("keeps the empty state useful", () => {
    render(<GroupCollection items={[]} />);
    expect(screen.getByText("Keep the regular crew together.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Create a group" })).toHaveAttribute("href", "/groups/new");
  });
});
