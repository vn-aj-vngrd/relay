import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createSessionAction: vi.fn(async () => ({})),
}));

import { CreateSessionForm } from "./create-session-form";

afterEach(cleanup);

describe("CreateSessionForm", () => {
  it("uses accessible quantity controls instead of limiting courts to presets", () => {
    render(<CreateSessionForm defaults={{ date: "2026-08-22", courts: 2 }} />);
    const courts = screen.getByRole("spinbutton", { name: "Court quantity" });

    expect(courts).toHaveValue(2);
    expect(courts.parentElement?.nextElementSibling).toHaveTextContent("The number of courts available to your group.");
    const capacity = screen.getByRole("spinbutton", { name: "Player limit" });
    expect(capacity.parentElement?.nextElementSibling).toHaveTextContent("Going players before waitlisting.");
    fireEvent.click(screen.getByRole("button", { name: "Increase court quantity" }));
    expect(courts).toHaveValue(3);
    fireEvent.change(courts, { target: { value: "20" } });
    expect(screen.getByRole("button", { name: "Increase court quantity" })).toBeDisabled();
  });
});
