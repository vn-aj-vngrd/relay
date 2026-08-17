import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ startLiveMode: vi.fn(async () => ({})) }));

import { PlaySetupForm } from "./play-setup-form";

afterEach(cleanup);

describe("PlaySetupForm", () => {
  it("starts with the flexible Paddle Stack setup and reveals its queue rule", () => {
    render(<PlaySetupForm sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" playerCount={10} courtCount={2} />);
    expect(screen.getByRole("radio", { name: /Paddle Stack/ })).toBeChecked();
    expect(screen.getByLabelText("Queue rule")).toHaveValue("adaptive");
    expect(screen.getByRole("button", { name: "Start Live Mode" })).toBeVisible();
  });

  it("explains and selects Mix It Up without showing Paddle Stack rules", () => {
    render(<PlaySetupForm sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" playerCount={8} courtCount={2} />);
    fireEvent.click(screen.getByRole("radio", { name: /Mix It Up/ }));
    expect(screen.queryByLabelText("Queue rule")).not.toBeInTheDocument();
    expect(screen.getByText(/new partners and fair rests/i)).toBeVisible();
  });

  it("only enables Court Climb when every court has exactly four players", () => {
    const { rerender } = render(<PlaySetupForm sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" playerCount={7} courtCount={2} />);
    expect(screen.getByRole("radio", { name: /Court Climb/ })).toBeDisabled();
    expect(screen.getByText("Needs exactly 8 active players for 2 courts.")).toBeVisible();
    rerender(<PlaySetupForm sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" playerCount={8} courtCount={2} />);
    expect(screen.getByRole("radio", { name: /Court Climb/ })).toBeEnabled();
  });
});
