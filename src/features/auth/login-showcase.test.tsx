import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginShowcase } from "./login-showcase";

describe("LoginShowcase", () => {
  it("lets visitors explore the session workflow", () => {
    render(<LoginShowcase />);
    expect(screen.getByText("Court 1 · 8–6")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Settle" }));

    expect(screen.getByText("₱300 per player")).toBeInTheDocument();
    expect(screen.getByText("Split expenses and review payment proof.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settle" })).toHaveAttribute("aria-pressed", "true");
  });
});
