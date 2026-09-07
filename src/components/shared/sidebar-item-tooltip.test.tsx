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
import { SidebarCollapseToggle } from "./sidebar-collapse-toggle";
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
function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}
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
  it("shares the 300ms delay, body portal, animation and description ownership", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    fireEvent.pointerEnter(trigger);
    advance(299);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    advance(1);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip.closest("aside")).toBeNull();
    expect(tooltip).toHaveClass("fixed", "z-[100]", "pl-2");
    expect(tooltip.firstElementChild).toHaveClass("relay-tooltip");
    expect(tooltip.firstElementChild).toHaveAttribute("data-state", "open");
    expect(trigger).toHaveAttribute("aria-label", "Open example");
    expect(trigger.getAttribute("aria-describedby")).toContain(tooltip.id);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-describedby", "existing-description");
    expect(tooltip.firstElementChild).toHaveAttribute("data-state", "closed");
    advance(120);
    expect(tooltip).not.toBeInTheDocument();
  });

  it("opens on focus immediately and lets the pointer cross onto the tooltip", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.pointerLeave(trigger);
    advance(300);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.blur(trigger);
    advance(270);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.pointerEnter(trigger);
    advance(300);
    fireEvent.pointerLeave(trigger);
    fireEvent.pointerEnter(screen.getByRole("tooltip"));
    advance(5000);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.pointerLeave(screen.getByRole("tooltip"));
    advance(270);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it.each(["scroll", "resize", "relay-sidebar-change", "storage"])(
    "dismisses stale coordinates on %s",
    (event) => {
      render(<Fixture />);
      fireEvent.focus(screen.getByRole("button", { name: "Open example" }));
      fireEvent(window, new Event(event));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    }
  );

  it("does not show compact item tooltips on expanded or mobile rails", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open example" });
    delete document.documentElement.dataset.sidebar;
    fireEvent.pointerEnter(trigger);
    advance(300);
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
    fireEvent.pointerEnter(
      screen.getByRole("button", { name: "Open example" })
    );
    unmount();
    advance(500);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
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
    {
      name: "sidebar toggle",
      content: <SidebarCollapseToggle />,
      role: "button",
      label: "Open sidebar",
      text: "Open sidebar",
    },
  ])(
    "uses the same delayed animated portal for $name",
    ({ content, role, label, text }) => {
      render(content);
      fireEvent.pointerEnter(screen.getByRole(role, { name: label }));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      advance(300);
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent(text);
      expect(tooltip.parentElement).toBe(document.body);
      expect(tooltip.firstElementChild).toHaveClass("relay-tooltip");
      expect(tooltip.firstElementChild).toHaveAttribute("data-state", "open");
    }
  );
});
