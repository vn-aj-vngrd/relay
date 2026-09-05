import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppNav } from "./app-nav";
import { PublicProductNav } from "./public-product-nav";
import { PublicProductShell } from "./public-product-shell";
import { SidebarAccount } from "./sidebar-account";
import { SidebarItemTooltip } from "./sidebar-item-tooltip";
import { SidebarSupportNav } from "./sidebar-support-nav";
import { SidebarUtilityNav } from "./sidebar-utility-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/help" }));
vi.mock("@/features/auth/actions", () => ({ signOut: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
  document.documentElement.dataset.sidebar = "compact";
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true }))
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.sidebar;
});

function Fixture() {
  return (
    <aside style={{ overflow: "auto", position: "fixed", zIndex: 30 }}>
      <button
        type="button"
        aria-label="Open example"
        aria-describedby="existing-description"
      >
        Icon<SidebarItemTooltip>Example tooltip</SidebarItemTooltip>
      </button>
      <p id="existing-description">Existing description</p>
    </aside>
  );
}

describe("SidebarItemTooltip", () => {
  it("escapes the scrolling sidebar into a fixed body portal without losing the trigger label", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip.closest("aside")).toBeNull();
    expect(tooltip).toHaveClass("fixed", "z-[100]");
    expect(trigger).toHaveAttribute("aria-label", "Open example");
    expect(trigger.getAttribute("aria-describedby")).toContain(tooltip.id);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-describedby", "existing-description");
    fireEvent.focus(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("supports focus/blur and a hoverable tooltip with delayed pointer dismissal", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.mouseLeave(trigger);
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(screen.getByRole("tooltip"));
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.mouseLeave(screen.getByRole("tooltip"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it.each(["scroll", "resize", "relay-sidebar-change", "storage"])(
    "dismisses stale coordinates on %s",
    (event) => {
      render(<Fixture />);
      fireEvent.mouseEnter(
        screen.getByRole("button", { name: "Open example" })
      );
      fireEvent(window, new Event(event));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    }
  );

  it("does not show compact tooltips on expanded or mobile rails", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    delete document.documentElement.dataset.sidebar;
    fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    document.documentElement.dataset.sidebar = "compact";
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }))
    );
    fireEvent.focus(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("removes portals and pending timers on unmount", () => {
    const { unmount } = render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    unmount();
    act(() => vi.advanceTimersByTime(150));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it.each([
    {
      name: "app navigation",
      content: <AppNav mode="sidebar" invitationCount={3} />,
      role: "link",
      label: /^Games/,
      text: "Games, 3 invites",
    },
    {
      name: "public navigation",
      content: <PublicProductNav mode="sidebar-support" />,
      role: "link",
      label: "Help Center",
      text: "Help Center",
    },
    {
      name: "support",
      content: <SidebarSupportNav />,
      role: "link",
      label: "Help Center",
      text: "Help Center",
    },
    {
      name: "utility",
      content: <SidebarUtilityNav />,
      role: "link",
      label: "Search",
      text: "Search",
    },
    {
      name: "account",
      content: <SidebarAccount name="Demo Reader" username="demo" />,
      role: "button",
      label: "Open account menu for Demo Reader",
      text: "Demo Reader",
    },
    {
      name: "public account access",
      content: <PublicProductShell>Public content</PublicProductShell>,
      role: "link",
      label: "Log in to Relay",
      text: "Log in",
    },
  ])("uses the shared portal for $name", ({ content, role, label, text }) => {
    render(content);
    fireEvent.mouseEnter(screen.getByRole(role, { name: label }));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent(text);
    expect(tooltip.parentElement).toBe(document.body);
  });
});
