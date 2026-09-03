import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ submitFeedbackAction: vi.fn(async () => ({})) }));

import { FeedbackForm } from "./feedback-form";

describe("FeedbackForm", () => {
  it("attaches completed-game context without asking the player to paste it", () => {
    const { container } = render(
      <FeedbackForm
        gameContext={{
          sessionId: "8768e5bf-25aa-4c4f-9cdf-6fcdb78b9c75",
          pagePath: "/games/8768e5bf-25aa-4c4f-9cdf-6fcdb78b9c75/play",
        }}
      />,
    );

    expect(screen.getByText("Feedback from your completed game")).toBeInTheDocument();
    expect(screen.getByLabelText("Related Relay page (optional)")).toHaveValue(
      "/games/8768e5bf-25aa-4c4f-9cdf-6fcdb78b9c75/play",
    );
    expect(screen.getByLabelText("Related Relay page (optional)")).toHaveAttribute("readonly");
    expect(container.querySelector('input[name="sessionId"]')).toHaveValue("8768e5bf-25aa-4c4f-9cdf-6fcdb78b9c75");
    expect(container.querySelector('input[name="experience"]')).toHaveValue("issues");
  });
});
