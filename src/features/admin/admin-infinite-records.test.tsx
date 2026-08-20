import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminInfiniteRecords } from "./admin-infinite-records";

let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerCallback = callback;
        observerOptions = options;
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

const first = {
  id: "3f50ee13-472f-4dc0-9e9b-df14470668ea",
  email: "one@example.com",
  createdAt: "2026-08-19T09:00:00.000Z",
  suspendedAt: null,
  name: "One Player",
  username: "one",
  sessionsHosted: 2,
};

const second = {
  ...first,
  id: "71da848c-2ba7-421b-a7a4-28f6676800ea",
  email: "two@example.com",
  name: "Two Player",
  username: "two",
};

describe("AdminInfiniteRecords", () => {
  it("renders an exhausted first page without a fixed record cap", () => {
    render(
      <AdminInfiniteRecords
        resource="users"
        initialPage={{ items: [first], nextCursor: null }}
        emptyMessage="No users"
      />,
    );

    expect(screen.getByText("One Player")).toBeVisible();
    expect(screen.getByText("All 1 matching records loaded.")).toBeVisible();
    expect(screen.queryByText(/showing up to/i)).not.toBeInTheDocument();
  });

  it("loads and deduplicates the next cursor page when the sentinel approaches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [first, second], nextCursor: null }),
      }),
    );
    render(
      <div data-admin-scroll data-testid="admin-scroll-root">
        <AdminInfiniteRecords
          resource="users"
          initialPage={{ items: [first], nextCursor: "next-page" }}
          emptyMessage="No users"
        />
      </div>,
    );

    expect(observerOptions?.root).toBe(screen.getByTestId("admin-scroll-root"));
    expect(screen.getByRole("button", { name: "Load more records" })).toBeVisible();

    await act(async () => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => expect(screen.getByText("Two Player")).toBeVisible());
    expect(screen.getAllByText("One Player")).toHaveLength(1);
    expect(screen.getByText("All 2 matching records loaded.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Load more records" })).not.toBeInTheDocument();
  });
});
