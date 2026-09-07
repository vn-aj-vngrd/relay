import { act, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameStatusChip, gameStatusLabel } from "./game-status";

const now = Date.parse("2026-06-01T12:00:00Z");
const past = "2026-06-01T11:00:00Z";
const future = "2026-06-01T13:00:00Z";

describe("game lifecycle presentation", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    [now, now + 7_200_000, "Published"],
    [now + 7_200_000, now, "Upcoming"],
  ])(
    "hydrates deterministically across server/client clock differences",
    async (serverTime, clientTime, expected) => {
      vi.useFakeTimers();
      vi.setSystemTime(serverTime);
      const element = <GameStatusChip status="published" endsAt={future} />;
      const container = document.createElement("div");
      container.innerHTML = renderToString(element);
      expect(container.textContent).toBe("Published");
      document.body.append(container);
      vi.setSystemTime(clientTime);
      const onRecoverableError = vi.fn();
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, element, { onRecoverableError });
        });
        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(container.textContent).toBe(expected);
      } finally {
        await act(async () => root?.unmount());
        container.remove();
      }
    }
  );

  it("updates at schedule expiry without a parent rerender", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { unmount } = render(
      <GameStatusChip status="published" endsAt={new Date(now + 1000)} />
    );
    expect(screen.getByText("Upcoming")).toBeVisible();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Published")).toBeVisible();
    expect(screen.queryByText("Ended")).not.toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels expiry work when authoritative lifecycle changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { rerender, unmount } = render(
      <GameStatusChip status="published" endsAt={future} />
    );
    rerender(<GameStatusChip status="live" endsAt={future} />);
    act(() => vi.advanceTimersByTime(7_200_000));
    expect(screen.getByText("Live")).toBeVisible();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["draft", "Draft"],
    ["live", "Live"],
    ["completed", "Ended"],
    ["cancelled", "Cancelled"],
  ] as const)("uses persisted %s even after scheduled end", (status, label) => {
    expect(gameStatusLabel(status, past, now)).toBe(label);
    expect(gameStatusLabel(status, future, now)).toBe(label);
    render(<GameStatusChip status={status} endsAt={past} />);
    expect(screen.getByText(label)).toBeVisible();
  });

  it("reflects refreshed authoritative lifecycle without stale Live text", () => {
    const { rerender } = render(<GameStatusChip status="live" />);
    expect(screen.getByText("Live")).toBeVisible();
    rerender(<GameStatusChip status="completed" />);
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeVisible();
  });

  it("never infers completion or live play from a published schedule", () => {
    expect(gameStatusLabel("published", future, now)).toBe("Upcoming");
    expect(gameStatusLabel("published", past, now)).toBe("Published");
    expect(gameStatusLabel("published", new Date(now), now)).toBe("Published");
    expect(gameStatusLabel("published", undefined, now)).toBe("Published");
    expect(gameStatusLabel("published", "invalid", now)).toBe("Published");
  });
});
