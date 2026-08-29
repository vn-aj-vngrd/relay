import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GroupCollection, type GroupCollectionItem, GroupViewMenu } from "./group-collection";

const items: GroupCollectionItem[] = [
  {
    id: "group-1",
    href: "/groups/tuesday-dink-club",
    name: "Tuesday Dink Club",
    initials: "TU",
    memberCount: 8,
    role: "owner",
    nextGameDate: "Sat, Aug 22",
    accentColor: "violet",
  },
];

describe("GroupCollection", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to a scannable list and switches to a persistent grid", () => {
    render(<GroupCollection items={items} />);

    expect(screen.getByTestId("groups-list")).toBeVisible();
    expect(screen.getByRole("link", { name: /Tuesday Dink Club/ })).toHaveAttribute(
      "href",
      "/groups/tuesday-dink-club",
    );

    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByTestId("groups-grid")).toBeVisible();
    expect(screen.getByTestId("groups-grid").querySelector(".grid")).toHaveClass("min-[380px]:grid-cols-2");
    expect(screen.getByRole("link", { name: /Tuesday Dink Club/ })).toHaveClass("p-3.5", "sm:p-5");
    expect(localStorage.getItem("relay-groups-view")).toBe("grid");
  });

  it("keeps mobile view selection behind one compact menu", () => {
    render(
      <>
        <GroupViewMenu />
        <GroupCollection items={items} />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change group view, currently List" }));
    const gridOption = screen.getByRole("menuitemradio", { name: "Grid" });
    expect(gridOption).toHaveAttribute("aria-checked", "false");

    fireEvent.click(gridOption);
    expect(screen.getByTestId("groups-grid")).toBeVisible();
    expect(screen.queryByRole("menu", { name: "Group view" })).not.toBeInTheDocument();
  });

  it("keeps the empty state useful", () => {
    render(<GroupCollection items={[]} />);
    expect(screen.getByText("Keep the regular crew together.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Create a group" })).toHaveAttribute("href", "/groups/new");
  });
});
