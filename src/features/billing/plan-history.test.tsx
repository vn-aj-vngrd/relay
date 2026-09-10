import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanHistory, termHistoryStatus } from "./plan-history";

const now = new Date("2026-06-15T04:00:00Z");
const term = {
  id: "term-1",
  requestId: "request-1",
  planVersion: "plus-old-version",
  source: "manual" as const,
  startsAt: new Date("2026-06-01T04:00:00Z"),
  endsAt: new Date("2026-07-01T04:00:00Z"),
  games: 11,
  storageBytes: 400 * 1024 * 1024,
};

describe("account plan history", () => {
  it("shows historical snapshots rather than today's catalog allowances", () => {
    render(<PlanHistory terms={[term]} now={now} assigned={false} />);
    expect(screen.getByText("Plus · Paid")).toBeInTheDocument();
    expect(screen.getByText(/11 games for this term/)).toBeInTheDocument();
    expect(
      screen.getByText(/400.0 MiB total photo storage/)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View payment" })).toHaveAttribute(
      "href",
      "/settings/plan/requests/request-1"
    );
  });

  it("distinguishes complimentary access from a payment", () => {
    render(
      <PlanHistory
        terms={[{ ...term, source: "complimentary", requestId: null }]}
        now={now}
        assigned={false}
      />
    );
    expect(screen.getByText("Plus · Complimentary")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View payment" })
    ).not.toBeInTheDocument();
  });

  it("does not mistake an underlying term for the current admin-assigned plan", () => {
    expect(termHistoryStatus(term, now, true)).toBe(
      "Active term · admin plan takes precedence"
    );
    expect(termHistoryStatus(term, term.endsAt, false)).toBe("Ended");
    expect(
      termHistoryStatus(term, new Date("2026-05-01T00:00:00Z"), false)
    ).toBe("Scheduled term");
  });
});
