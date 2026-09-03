import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TabChipRail } from "./tab-chip-rail";

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

describe("TabChipRail", () => {
  it("shows only the fade edges that have more scrollable content", () => {
    let scrollLeft = 0;
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(
      () => scrollLeft
    );
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(({ left }: ScrollToOptions) => {
        scrollLeft = left ?? 0;
      }),
    });

    render(
      <TabChipRail
        label="Game filters"
        items={[
          { value: "upcoming", label: "Upcoming" },
          { value: "all", label: "All" },
          { value: "past", label: "Past" },
        ]}
        value="upcoming"
        onChange={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "Upcoming" })).toHaveClass(
      "compact-control",
      "tab-chip",
      "min-h-9"
    );

    const rail = screen.getByRole("group", { name: "Game filters" })
      .parentElement!;
    expect(rail).toHaveClass(
      "focus-scroll-rail",
      "tab-chip-fade-right",
      "px-1.5",
      "-mx-1.5"
    );

    scrollLeft = 100;
    fireEvent.scroll(rail);
    expect(rail).toHaveClass("tab-chip-fade-both");

    scrollLeft = 200;
    fireEvent.scroll(rail);
    expect(rail).toHaveClass("tab-chip-fade-left");
  });

  it("keeps a keyboard-focused item inside the visible focus gutter", () => {
    const scrollTo = vi.fn();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    render(
      <TabChipRail
        label="Game navigation"
        items={[
          { value: "overview", label: "Overview" },
          { value: "players", label: "Players" },
        ]}
        value="overview"
        hrefFor={(item) => `/${item.value}`}
        variant="underline"
      />
    );

    const players = screen.getByRole("link", { name: "Players" });
    Object.defineProperties(players, {
      offsetLeft: { configurable: true, value: 190 },
      offsetWidth: { configurable: true, value: 70 },
    });
    fireEvent.focus(players);

    expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "auto",
      left: 68,
    });
  });
});
