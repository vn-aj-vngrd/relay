import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IconTooltip } from "./icon-tooltip";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "PointerEvent",
    class extends MouseEvent {
      readonly pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? "mouse";
      }
    }
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function advance(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}
function Fixture() {
  return (
    <IconTooltip label="Coverage is currently limited.">
      <button type="button" aria-describedby="existing-help">
        Coverage
      </button>
    </IconTooltip>
  );
}

describe("IconTooltip", () => {
  it("waits 300ms for hover intent and cancels a passing pointer", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Coverage" });
    fireEvent.pointerEnter(trigger);
    advance(299);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.pointerLeave(trigger);
    advance(300);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.pointerEnter(trigger);
    advance(300);
    expect(screen.getByRole("tooltip")).toBeVisible();
  });

  it("opens immediately on focus, preserves descriptions and leaves focus on the control", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Coverage" });
    act(() => trigger.focus());
    const tooltip = screen.getByRole("tooltip");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute(
      "aria-describedby",
      `existing-help ${tooltip.id}`
    );
    expect(tooltip).toHaveTextContent("Coverage is currently limited.");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-describedby", "existing-help");
  });

  it("stays dismissed until a new hover/focus cycle, including pending opens", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Coverage" });
    fireEvent.pointerEnter(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    advance(500);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.pointerEnter(trigger);
    advance(500);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.pointerLeave(trigger);
    fireEvent.pointerEnter(trigger);
    advance(300);
    expect(screen.getByRole("tooltip")).toBeVisible();
  });

  it("keeps a hoverable padded bridge and never expires while reading", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Coverage" });
    fireEvent.pointerEnter(trigger);
    advance(300);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip).toHaveClass("fixed", "pt-2");
    expect(tooltip.firstElementChild).toHaveClass("relay-tooltip");
    expect(tooltip).not.toHaveClass("pointer-events-none");
    fireEvent.pointerLeave(trigger);
    advance(100);
    fireEvent.pointerEnter(tooltip);
    advance(5000);
    expect(tooltip).toHaveAttribute("data-state", "open");
    fireEvent.pointerLeave(tooltip);
    advance(150);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(tooltip).toHaveAttribute("data-state", "closed");
    advance(120);
    expect(tooltip).not.toBeInTheDocument();
  });

  it("does not close while the trigger is still focused", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Coverage" });
    act(() => trigger.focus());
    fireEvent.pointerLeave(trigger);
    advance(1000);
    expect(screen.getByRole("tooltip")).toBeVisible();
    act(() => trigger.blur());
    advance(270);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("preserves an explicit ID and closes on activation without consuming the click", () => {
    const click = vi.fn();
    render(
      <IconTooltip id="coverage-help" label="Coverage is currently limited.">
        <button type="button" onClick={click}>
          Help
        </button>
      </IconTooltip>
    );
    const trigger = screen.getByRole("button", { name: "Help" });
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toHaveAttribute("id", "coverage-help");
    fireEvent.click(trigger);
    expect(click).toHaveBeenCalledOnce();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not intercept touch activation or create a sticky touch tooltip", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Coverage" });
    fireEvent.pointerEnter(trigger, { pointerType: "touch" });
    fireEvent.pointerDown(trigger, { pointerType: "touch" });
    fireEvent.focus(trigger);
    advance(500);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("suppresses the tooltip while its owning menu is open", () => {
    const { rerender } = render(
      <IconTooltip label="More actions">
        <button type="button">More</button>
      </IconTooltip>
    );
    fireEvent.focus(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("tooltip")).toBeVisible();
    rerender(
      <IconTooltip label="More actions" disabled>
        <button type="button">More</button>
      </IconTooltip>
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("cleans up pending timers on unmount", () => {
    const { unmount } = render(<Fixture />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Coverage" }));
    unmount();
    advance(1000);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves centered and bottom placement without a non-hoverable margin", () => {
    render(
      <IconTooltip label="Court coverage" align="center" side="bottom">
        <button type="button">Coverage</button>
      </IconTooltip>
    );
    fireEvent.focus(screen.getByRole("button", { name: "Coverage" }));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("fixed", "pt-2");
    expect(tooltip).toHaveAttribute("data-side", "bottom");
    expect(tooltip.parentElement).toBe(document.body);
  });
});
