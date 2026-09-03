import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  updateSignupCapacityAction: vi.fn(async () => ({})),
}));

import { SignupCapacityControl } from "./signup-capacity-control";

afterEach(cleanup);

describe("SignupCapacityControl", () => {
  it("shows the current limit and remaining beta places", () => {
    render(<SignupCapacityControl accountCap={200} userCount={175} />);

    expect(
      screen.getByRole("spinbutton", { name: "Maximum accounts" })
    ).toHaveValue(200);
    expect(screen.getByText("25 places remaining")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Save account limit" })
    ).toBeEnabled();
  });

  it("states when public signup has reached the account limit", () => {
    render(<SignupCapacityControl accountCap={200} userCount={200} />);

    expect(screen.getByText("Signup is full")).toBeVisible();
    expect(
      screen.getByText(/existing accounts can still sign in/i)
    ).toBeVisible();
  });
});
