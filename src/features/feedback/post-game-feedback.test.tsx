import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  dismissPostGameFeedback: vi.fn(),
  recordSmoothGameFeedback: vi.fn(async () => ({ success: "Thanks" })),
}));

import { PostGameFeedback } from "./post-game-feedback";

describe("PostGameFeedback", () => {
  it("offers one lightweight response, contextual issue reporting, and dismissal", () => {
    render(
      <PostGameFeedback
        sessionId="session-1"
        issueHref="/feedback?session=session-1"
      />
    );

    expect(
      screen.getByRole("heading", { name: "How did this game go?" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Smooth/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Had some issues/ })
    ).toHaveAttribute("href", "/feedback?session=session-1");
    expect(
      screen.getByRole("button", { name: "Dismiss game feedback" })
    ).toBeInTheDocument();
  });
});
