import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmSubmitButton } from "./confirm-submit-button";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ConfirmSubmitButton", () => {
  it("cancels form submission when confirmation is declined", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton confirmText="End session?">End session</ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "End session" }));

    expect(window.confirm).toHaveBeenCalledWith("End session?");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows form submission when confirmation is accepted", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ConfirmSubmitButton confirmText="End session?">End session</ConfirmSubmitButton>
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "End session" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
