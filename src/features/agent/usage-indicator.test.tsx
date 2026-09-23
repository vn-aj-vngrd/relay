import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentUsageIndicator } from "./usage-indicator";

const usage = {
  plan: "pro" as const,
  used: 19,
  limit: 750,
  reserved: 1,
  remaining: 730,
  resetsAt: "2026-10-08T16:00:00Z",
};
describe("Agent usage indicator", () => {
  it("reveals exact usage and Philippine reset date on keyboard focus", async () => {
    render(<AgentUsageIndicator usage={usage} />);
    expect(screen.queryByText(/resets/)).toBeNull();
    fireEvent.focus(screen.getByRole("button", { name: /Message allowance/ }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("3% of message allowance in use");
    expect(tooltip).toHaveTextContent("19 of 750 messages used");
    expect(tooltip).toHaveTextContent("1 in progress");
    expect(tooltip).toHaveTextContent("October 9 (PH time)");
  });
  it("opens on tap and closes with Escape or an outside interaction", () => {
    render(<AgentUsageIndicator usage={usage} />);
    const button = screen.getByRole("button", { name: /Message allowance/ });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      within(
        screen.getByRole("region", { name: "Message allowance details" })
      ).getByText(/19 of 750/)
    ).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("region", { name: "Message allowance details" })
    ).toBeNull();
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(
      screen.queryByRole("region", { name: "Message allowance details" })
    ).toBeNull();
  });
  it("handles zero allowance without a misleading percentage", () => {
    render(
      <AgentUsageIndicator
        usage={{ ...usage, limit: 0, used: 0, reserved: 0, remaining: 0 }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Message allowance/ }));
    expect(
      screen.getByRole("region", { name: "Message allowance details" })
    ).toHaveTextContent("No messages available");
    expect(
      screen.getByRole("region", { name: "Message allowance details" })
    ).not.toHaveTextContent("NaN");
  });
});
