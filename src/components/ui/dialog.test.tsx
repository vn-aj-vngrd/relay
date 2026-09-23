import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "./dialog";

describe("Dialog", () => {
  it("dismisses a backdrop click but preserves inside clicks and drags starting inside", () => {
    const dismiss = vi.fn();
    render(
      <Dialog open variant="drawer" onDismiss={dismiss} aria-label="Players">
        <button type="button">Inside</button>
      </Dialog>
    );
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
      left: 400,
      right: 800,
      top: 0,
      bottom: 600,
      x: 400,
      y: 0,
      width: 400,
      height: 600,
      toJSON: () => ({}),
    });
    const point = (type: string, target: Element, x: number) =>
      fireEvent(
        target,
        new MouseEvent(type, { bubbles: true, clientX: x, clientY: 100 })
      );
    point("pointerdown", dialog, 500);
    point("click", dialog, 500);
    expect(dismiss).not.toHaveBeenCalled();
    point("pointerdown", screen.getByRole("button"), 500);
    point("click", dialog, 100);
    expect(dismiss).not.toHaveBeenCalled();
    point("pointerdown", dialog, 100);
    point("click", dialog, 100);
    expect(dismiss).toHaveBeenCalledOnce();
  });
  it("provides the shared motion surface while preserving dialog props and refs", () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <Dialog ref={ref} aria-label="Example dialog" className="custom-dialog">
        Dialog content
      </Dialog>
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("aria-label", "Example dialog");
    expect(dialog).toHaveClass("relay-dialog", "custom-dialog");
    expect(ref.current).toBe(dialog);
  });
});
