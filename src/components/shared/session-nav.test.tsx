import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionNav } from "./session-nav";

describe("SessionNav", () => {
  it("matches the shared-link information architecture", () => {
    render(<SessionNav id="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" active="Payments" />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Overview", "Players", "Play", "Chat", "Payments"]);
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/games/59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7/play");
  });
});
