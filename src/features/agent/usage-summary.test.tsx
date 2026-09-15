import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AgentUsageSummaryView } from "./usage-summary";

it("shows message usage and an explicit Philippine reset date", () => {
  render(
    <AgentUsageSummaryView
      usage={{
        plan: "free",
        used: 12,
        limit: 50,
        reserved: 1,
        remaining: 37,
        resetsAt: "2026-09-30T16:00:00Z",
      }}
    />
  );
  expect(screen.getByText(/12 of 50 messages used/)).toHaveTextContent(
    "1 in progress"
  );
  expect(screen.getByText(/12 of 50 messages used/)).toHaveTextContent(
    "October 1 (PH time)"
  );
  expect(
    screen.queryByRole("link", { name: "Plan & billing" })
  ).not.toBeInTheDocument();
});
