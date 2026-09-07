import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/features/sessions/actions", () => ({
  createSessionAction: vi.fn(),
  rsvpAction: vi.fn(),
}));
vi.mock("@/features/matches/actions", () => ({
  finishMatch: vi.fn(),
  saveScore: vi.fn(),
  startPlay: vi.fn(),
}));
vi.mock("@/features/payments/actions", () => ({ markPaymentSent: vi.fn() }));
vi.mock("@/features/chat/actions", () => ({ sendMessage: vi.fn() }));
vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { HeroProductShot } from "./product-previews";

beforeAll(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("HeroProductShot", () => {
  it("opens the roster from Play without adding a Players destination", () => {
    render(<HeroProductShot />);
    expect(
      screen.queryByRole("button", { name: "Show Players" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show Play" }));
    const players = screen.getByRole("button", { name: "Players (8)" });
    expect(players.closest("[inert]")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Up next" }).closest("[inert]")
    ).not.toBeNull();
    fireEvent.click(players);
    expect(screen.getByRole("dialog", { name: "Players (8)" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Going" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close players" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Up next" })).toBeVisible();
  });
  it("suspends automatic movement while the roster is open and resumes after closing", () => {
    vi.useFakeTimers();
    try {
      render(<HeroProductShot />);
      act(() => vi.advanceTimersByTime(0));
      fireEvent.click(screen.getByRole("button", { name: "Show Play" }));
      fireEvent.click(screen.getByRole("button", { name: "Players (8)" }));
      act(() => vi.advanceTimersByTime(13000));
      expect(screen.getByRole("dialog", { name: "Players (8)" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Show Play" })).toHaveAttribute(
        "aria-current",
        "true"
      );
      fireEvent.click(screen.getByRole("button", { name: "Close players" }));
      act(() => vi.advanceTimersByTime(6500));
      expect(screen.getByRole("button", { name: "Show Chat" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the current responsive product structure instead of a stale screenshot", () => {
    const { container } = render(<HeroProductShot />);

    expect(
      screen.getByRole("heading", { name: "Saturday Night Pickle" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Show Story" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Game activity" })
    ).toBeVisible();
    expect(
      screen.getByRole("region", {
        name: "A Relay game from overview to story",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Show Overview" })
    ).toHaveAttribute("aria-current", "true");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(
      container.querySelector('img[src="/images/product/overview.webp"]')
    ).not.toBeInTheDocument();
  });

  it("auto-advances while the preview is idle", () => {
    vi.useFakeTimers();
    try {
      render(<HeroProductShot />);
      act(() => vi.advanceTimersByTime(0));

      fireEvent.mouseEnter(
        screen.getByRole("region", {
          name: "A Relay game from overview to story",
        })
      );
      fireEvent.focus(
        screen.getByRole("button", { name: "Pause automatic preview" })
      );
      fireEvent.pointerDown(
        screen.getByRole("group", { name: "1 of 5: Overview" }),
        {
          pointerType: "touch",
          clientX: 120,
        }
      );
      act(() => vi.advanceTimersByTime(6500));
      expect(screen.getByRole("button", { name: "Show Play" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits to auto-advance until the carousel reaches the viewport", () => {
    vi.useFakeTimers();
    let notifyIntersection: IntersectionObserverCallback = () => undefined;
    const observer = {
      disconnect: vi.fn(),
      observe: vi.fn(),
      takeRecords: vi.fn(),
      unobserve: vi.fn(),
      root: null,
      rootMargin: "0px",
      thresholds: [0, 0.98],
    };
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notifyIntersection = callback;
        }
        disconnect = observer.disconnect;
        observe = observer.observe;
        takeRecords = observer.takeRecords;
        unobserve = observer.unobserve;
        root = observer.root;
        rootMargin = observer.rootMargin;
        thresholds = observer.thresholds;
      }
    );
    try {
      render(<HeroProductShot />);
      act(() => vi.advanceTimersByTime(6500));
      expect(
        screen.getByRole("button", { name: "Show Overview" })
      ).toHaveAttribute("aria-current", "true");

      const carousel = screen.getByRole("region", {
        name: "A Relay game from overview to story",
      });
      act(() =>
        notifyIntersection(
          [
            {
              target: carousel,
              intersectionRatio: 1,
              isIntersecting: true,
            } as unknown as IntersectionObserverEntry,
          ],
          observer as IntersectionObserver
        )
      );
      act(() => vi.advanceTimersByTime(6500));
      expect(screen.getByRole("button", { name: "Show Play" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("honors the explicit pause control", () => {
    vi.useFakeTimers();
    try {
      render(<HeroProductShot />);

      fireEvent.click(
        screen.getByRole("button", { name: "Pause automatic preview" })
      );
      act(() => vi.advanceTimersByTime(13000));
      expect(
        screen.getByRole("button", { name: "Show Overview" })
      ).toHaveAttribute("aria-current", "true");

      fireEvent.click(
        screen.getByRole("button", { name: "Resume automatic preview" })
      );
      act(() => vi.advanceTimersByTime(6500));
      expect(screen.getByRole("button", { name: "Show Play" })).toHaveAttribute(
        "aria-current",
        "true"
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("moves through the game story from the bottom controls", () => {
    render(<HeroProductShot />);

    fireEvent.click(screen.getByRole("button", { name: "Show Play" }));
    expect(screen.getByRole("button", { name: "Show Play" })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(screen.getByRole("heading", { name: "Up next" })).toBeVisible();
    expect(screen.getByRole("group", { name: "2 of 5: Play" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Show Payments" }));
    expect(
      screen.getByRole("heading", { name: "1 proof to review" })
    ).toBeVisible();
    expect(screen.getByText("₱2,400")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Show Story" }));
    expect(
      screen.getByRole("region", { name: "Memory story template examples" })
    ).toBeVisible();
    expect(screen.queryByText("LAYOUT")).not.toBeInTheDocument();
  });
});
