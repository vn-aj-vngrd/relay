import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GroupCollection, type GroupCollectionItem, GroupViewMenu } from "./group-collection";

const items: GroupCollectionItem[] = [
  {
    id: "group-1",
    href: "/groups/tuesday-dink-club",
    name: "Tuesday Dink Club",
    initials: "TU",
    imageUrl: "https://relay.supabase.co/storage/v1/object/public/avatars/owner/group.webp",
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

  it("shows the selected group photo as a circle in list and grid views", () => {
    render(<GroupCollection items={items} />);
    const listImage = screen.getByTestId("groups-list").querySelector("img");
    expect(listImage).toBeVisible();
    expect(listImage?.parentElement).toHaveClass("rounded-full");

    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    const gridImage = screen.getByTestId("groups-grid").querySelector("img");
    expect(gridImage).toBeVisible();
    expect(gridImage?.parentElement).toHaveClass("rounded-full");
  });

  it("keeps mobile view selection behind one compact menu", () => {
    render(
      <>
        <GroupViewMenu />
        <GroupCollection items={items} />
      </>,
    );

    const viewTrigger = screen.getByRole("button", { name: "Change group view, currently List" });
    expect(viewTrigger).toHaveClass("h-9", "w-9", "border-transparent");
    expect(viewTrigger).not.toHaveClass("border-line");
    fireEvent.click(viewTrigger);
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
