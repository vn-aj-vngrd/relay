import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type AgentWork,
  finishWork,
  formatWorkDuration,
  messageWork,
  toolWorkStep,
} from "./work";
import { AgentWorkLog } from "./work-log";

afterEach(() => vi.useRealTimers());
const work: AgentWork = {
  startedAt: 0,
  status: "working",
  entries: [{ step: "games", status: "running" }],
};
describe("Agent work activity", () => {
  it("ticks while working, collapses on completion and expands the saved log", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { rerender } = render(<AgentWorkLog work={work} />);
    expect(screen.getByRole("list", { name: "Agent activity" })).toBeVisible();
    act(() => vi.advanceTimersByTime(62_000));
    expect(screen.getByText("Working for 1m 2s")).toBeInTheDocument();
    rerender(<AgentWorkLog work={finishWork(work, "completed")} />);
    const summary = screen.getByRole("button", { name: "Worked for 1m 2s" });
    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list", { name: "Agent activity" })).toBeNull();
    act(() => vi.advanceTimersByTime(10_000));
    expect(summary).toHaveTextContent("Worked for 1m 2s");
    fireEvent.click(summary);
    expect(
      screen.getByRole("list", { name: "Agent activity" })
    ).toHaveTextContent("Searching games");
    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });
  it.each(["stopped", "failed"] as const)(
    "freezes and identifies %s work",
    (status) => {
      vi.useFakeTimers();
      vi.setSystemTime(5000);
      const result = finishWork(work, status);
      render(<AgentWorkLog work={result} />);
      expect(screen.getByRole("button")).toHaveTextContent(
        status === "stopped" ? "Stopped" : "Interrupted"
      );
      expect(result.entries[0].status).toBe(status);
      expect(result.finishedAt).toBe(5000);
    }
  );
  it("accepts only known activity labels and tolerates legacy messages", () => {
    expect(toolWorkStep("searchGames")).toBe("games");
    expect(toolWorkStep("privateProviderTool")).toBeUndefined();
    expect(
      messageWork({ id: "legacy", role: "assistant", parts: [] })
    ).toBeNull();
    expect(
      messageWork({
        id: "unsafe",
        role: "assistant",
        parts: [],
        metadata: {
          work: {
            ...work,
            entries: [{ step: "PRIVATE_PAYLOAD", status: "running" }],
          },
        },
      })
    ).toBeNull();
    expect(formatWorkDuration(-1000)).toBe("0s");
  });
});
