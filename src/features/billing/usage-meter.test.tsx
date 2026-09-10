import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { UsageMeter } from "./usage-meter";

afterEach(cleanup);

describe("UsageMeter", () => {
  it("exposes a labeled percentage with the actual allowance as accessible text", () => {
    render(
      <UsageMeter
        label="Games used"
        used={2}
        limit={5}
        unlimited={false}
        valueText="2 / 5 games"
      />
    );
    const meter = screen.getByRole("meter", { name: "Games used" });
    expect(meter).toHaveAttribute("aria-valuenow", "40");
    expect(meter).toHaveAttribute("aria-valuetext", "2 / 5 games");
  });

  it("clamps over-limit consumption while preserving the actual value", () => {
    render(
      <UsageMeter
        label="Games used"
        used={8}
        limit={5}
        unlimited={false}
        valueText="8 / 5 games"
      />
    );
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("8 / 5 games")).toBeInTheDocument();
  });

  it("handles a zero allowance without division by zero", () => {
    render(
      <UsageMeter
        label="Games used"
        used={0}
        limit={0}
        unlimited={false}
        valueText="0 / 0 games"
      />
    );
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows consumption without a fictitious percentage for Unlimited", () => {
    render(
      <UsageMeter
        label="Games used"
        used={7}
        limit={0}
        unlimited
        valueText="7 / Unlimited"
      />
    );
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.getByText("7 / Unlimited")).toBeInTheDocument();
    expect(screen.getByText("No plan limit")).toBeInTheDocument();
  });
});
