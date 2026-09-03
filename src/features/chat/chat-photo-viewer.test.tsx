import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatPhotoViewer } from "./chat-photo-viewer";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: vi.fn(function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: vi.fn(function close(this: HTMLDialogElement) {
      this.removeAttribute("open");
    }),
  });
});

describe("ChatPhotoViewer", () => {
  it("opens a full photo dialog and provides an explicit close action", () => {
    render(
      <ChatPhotoViewer
        src="https://test.supabase.co/photo.jpg"
        alt="Photo from Mika"
        sender="Mika"
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open photo from Mika" })
    );
    const dialog = screen.getByRole("dialog", { name: "Photo from Mika" });
    expect(dialog).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});
