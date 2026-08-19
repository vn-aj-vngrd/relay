import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ConfirmSubmitButton } from "./confirm-submit-button";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ConfirmSubmitButton", () => {
  it("opens an accessible Relay confirmation without submitting immediately", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton confirmTitle="End this session?" confirmText="The game will become a shared memory.">
          End session
        </ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "End session" }));

    expect(screen.getByRole("dialog", { name: "End this session?" })).toHaveAttribute("open");
    expect(screen.getByText("The game will become a shared memory.")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("closes without submitting when cancelled", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton confirmTitle="End this session?" confirmText="The game will become a shared memory.">
          End session
        </ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep playing" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  it("submits the parent form only after confirmation", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton
          confirmTitle="End this session?"
          confirmText="The game will become a shared memory."
          confirmLabel="End session"
        >
          End session
        </ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    const dialog = screen.getByRole("dialog", { name: "End this session?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "End session" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
