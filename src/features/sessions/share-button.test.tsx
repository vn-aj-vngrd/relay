import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  track: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: mocks.track,
}));
afterEach(() => vi.restoreAllMocks());

import { ShareButton } from "./share-button";

describe("ShareButton", () => {
  it("uses the standard secondary action treatment and consistent label", () => {
    render(<ShareButton url="/s/friends-night" title="Friends Night" />);
    expect(screen.getByRole("button", { name: "Share game" })).toHaveClass(
      "min-h-9",
      "text-[13px]",
      "bg-surface"
    );
  });

  it("uses a 44px icon target in compact mobile game chrome", () => {
    render(
      <ShareButton
        url="/s/friends-night"
        title="Friends Night"
        compactOnMobile
      />
    );
    expect(screen.getByRole("button", { name: "Share game" })).toHaveClass(
      "h-11",
      "w-11",
      "px-0"
    );
  });
});

describe("game sharing recovery", () => {
  it("copies the link after native sharing fails and does not let analytics change success", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("Unavailable")),
    });
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: copy },
    });
    mocks.track.mockRejectedValueOnce(new Error("Offline"));
    const shared = vi.fn();
    render(
      <ShareButton
        url="/s/friends-night"
        title="Friends Night"
        sessionId="game"
        onShared={shared}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Share game" }));
    await waitFor(() => expect(shared).toHaveBeenCalledOnce());
    expect(copy).toHaveBeenCalledWith(
      new URL("/s/friends-night", window.location.origin).toString()
    );
    expect(
      screen.getByRole("button", { name: "Game link copied" })
    ).toBeVisible();
  });
  it("provides a selectable link when both browser sharing paths fail", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true;
      },
    });
    const selected = vi.fn();
    render(
      <ShareButton
        url="/s/friends-night"
        title="Friends Night"
        onSelect={selected}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Share game" }));
    expect(
      await screen.findByRole("dialog", { name: "Copy the game link" })
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Game link" })).toHaveValue(
        new URL("/s/friends-night", window.location.origin).toString()
      )
    );
    expect(selected).not.toHaveBeenCalled();
  });
  it("treats a dismissed share sheet as cancellation", async () => {
    const copy = vi.fn();
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: vi
        .fn()
        .mockRejectedValue(new DOMException("Cancelled", "AbortError")),
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: copy },
    });
    render(<ShareButton url="/s/friends-night" title="Friends Night" />);
    fireEvent.click(screen.getByRole("button", { name: "Share game" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Share game" })).toBeEnabled()
    );
    expect(copy).not.toHaveBeenCalled();
  });
});
