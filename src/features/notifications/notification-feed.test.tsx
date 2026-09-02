import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const notificationActions = vi.hoisted(() => ({
  markNotificationRead: vi.fn(),
  openNotification: vi.fn(),
}));

vi.mock("./actions", () => notificationActions);

import { NotificationFeed } from "./notification-feed";
import type { NotificationFeedItem } from "./queries";

let observerCallback: IntersectionObserverCallback;

beforeEach(() => {
  vi.clearAllMocks();
  notificationActions.markNotificationRead.mockResolvedValue(undefined);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "0px";
      thresholds = [];
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const first: NotificationFeedItem = {
  id: "3f50ee13-472f-4dc0-9e9b-df14470668ea",
  sessionId: null,
  type: "session_invite",
  payload: {},
  readAt: null,
  createdAt: new Date().toISOString(),
  sessionTitle: "Friday Pickle",
};
const second: NotificationFeedItem = {
  ...first,
  id: "71da848c-2ba7-421b-a7a4-28f6676800ea",
  type: "payment_confirmed",
  readAt: new Date().toISOString(),
};

describe("NotificationFeed", () => {
  it("marks one notification as read without opening it", async () => {
    render(<NotificationFeed filter="all" initialPage={{ items: [first, second], nextCursor: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark Friday Pickle as read" }));

    await waitFor(() => expect(notificationActions.markNotificationRead).toHaveBeenCalledOnce());
    expect(screen.queryByRole("button", { name: "Mark Friday Pickle as read" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("img", { name: "Unread" })).toHaveLength(0);
  });

  it("removes a marked notification from the unread filter", async () => {
    render(<NotificationFeed filter="unread" initialPage={{ items: [first], nextCursor: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark Friday Pickle as read" }));

    await waitFor(() => expect(screen.getByText("No unread updates")).toBeVisible());
  });

  it("restores a notification when marking it as read fails", async () => {
    notificationActions.markNotificationRead.mockRejectedValueOnce(new Error("offline"));
    render(<NotificationFeed filter="unread" initialPage={{ items: [first], nextCursor: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark Friday Pickle as read" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That notification couldn’t be marked as read. Try again.",
    );
    expect(screen.getByRole("button", { name: "Mark Friday Pickle as read" })).toBeVisible();
  });

  it("loads and deduplicates the next cursor page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [first, second], nextCursor: null }) }),
    );
    render(<NotificationFeed filter="all" initialPage={{ items: [first], nextCursor: "next-page" }} />);

    expect(screen.getByRole("button", { name: "Load older updates" })).toBeVisible();
    await act(async () => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => expect(screen.getByText("Payment confirmed")).toBeVisible());
    expect(screen.getAllByText("You’re invited")).toHaveLength(1);
    expect(screen.getByText("You’ve reached the first update.")).toBeVisible();
  });
});
