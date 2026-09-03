import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Dialog } from "./dialog";

describe("Dialog", () => {
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
