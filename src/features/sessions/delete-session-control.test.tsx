import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./delete-session", () => ({ deleteSessionAction: vi.fn(async () => ({})) }));

import { DeleteSessionControl } from "./delete-session-control";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});
afterEach(cleanup);

describe("DeleteSessionControl", () => {
  it("requires the exact game title before enabling permanent deletion", () => {
    render(<DeleteSessionControl sessionId="0f0d45dc-30c2-4c5d-95a3-cd9957529477" title="Saturday Night Pickle" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete game" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("open");

    const confirmation = screen.getByLabelText(/Type Saturday Night Pickle/);
    const submit = screen.getAllByRole("button", { name: "Delete game" }).at(-1)!;
    expect(submit).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: "Saturday night pickle" } });
    expect(submit).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: "Saturday Night Pickle" } });
    expect(submit).toBeEnabled();
  });
});
