import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { MemoryPhotoGallery } from "./memory-photo-gallery";

const photos = [
  {
    id: "one",
    url: "/one.jpg",
    alt: "Court crew",
    caption: "Our Saturday game",
  },
  {
    id: "two",
    url: "/two.jpg",
    alt: "Winning point",
    caption: "One more game",
  },
];

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    }),
  });
});

it("opens the selected photo, cycles in both directions and restores focus", () => {
  render(<MemoryPhotoGallery photos={photos} />);
  const opener = screen.getByRole("button", {
    name: "Open photo 2: Winning point",
  });
  fireEvent.click(opener);
  const dialog = screen.getByRole("dialog", { name: "Game photo viewer" });
  expect(within(dialog).getByText("2 / 2")).toBeVisible();
  expect(within(dialog).getByText("One more game")).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Next photo" }));
  expect(within(dialog).getByRole("img", { name: "Court crew" })).toBeVisible();
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(within(dialog).getByText("2 / 2")).toBeVisible();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Close photo viewer" })
  );
  expect(dialog).not.toHaveAttribute("open");
  expect(opener).toHaveFocus();
});

it("supports horizontal swipes without treating vertical scroll as navigation", () => {
  render(<MemoryPhotoGallery photos={photos} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Open photo 1: Court crew" })
  );
  const dialog = screen.getByRole("dialog");
  const stage = within(dialog).getByRole("img").parentElement!;
  fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 200 }] });
  fireEvent.touchEnd(stage, {
    changedTouches: [{ clientX: 190, clientY: 50 }],
    touches: [],
  });
  expect(within(dialog).getByText("1 / 2")).toBeVisible();
  fireEvent.touchStart(stage, { touches: [{ clientX: 200, clientY: 200 }] });
  fireEvent.touchEnd(stage, {
    changedTouches: [{ clientX: 50, clientY: 205 }],
    touches: [],
  });
  expect(within(dialog).getByText("2 / 2")).toBeVisible();
});

it("hides navigation for one photo and keeps close available on image failure", () => {
  render(<MemoryPhotoGallery photos={[photos[0]]} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Open photo 1: Court crew" })
  );
  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).queryByRole("button", { name: "Next photo" })
  ).toBeNull();
  fireEvent.error(within(dialog).getByRole("img"));
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    "could not load"
  );
  expect(
    within(dialog).getByRole("button", { name: "Close photo viewer" })
  ).toBeEnabled();
});
