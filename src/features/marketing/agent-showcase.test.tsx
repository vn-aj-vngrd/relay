import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentShowcase } from "./agent-showcase";

describe("landing Agent highlight", () => {
  it("uses configured allowances and clearly marks an unreleased feature", () => {
    render(
      <AgentShowcase
        agent={{
          enabled: false,
          freeMessages: 75,
          plusMessages: 300,
          proMessages: 900,
        }}
      />
    );
    expect(
      screen.getByRole("heading", {
        name: /Ask Agent\.\s*Get back to the game\./,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("75 messages/month on Free")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See Agent plans" })
    ).toHaveAttribute("href", "/pricing");
    expect(screen.getByText(/Illustrative game\./)).toBeInTheDocument();
  });
  it("offers the real assistant when enabled", () => {
    render(
      <AgentShowcase
        agent={{
          enabled: true,
          freeMessages: 50,
          plusMessages: 250,
          proMessages: 750,
        }}
      />
    );
    expect(screen.getByRole("link", { name: "Ask Agent" })).toHaveAttribute(
      "href",
      "/agent"
    );
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });
});
