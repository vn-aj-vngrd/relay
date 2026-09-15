import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { PendingSubmit } from "./pending-submit";

vi.mock("react-dom", async (original) => ({
  ...(await original<typeof import("react-dom")>()),
  useFormStatus: () => ({ pending: true }),
}));
it("keeps the saving spinner sized and aligned inside disabled submit controls", () => {
  render(
    <PendingSubmit pendingLabel="Saving…">Save Agent settings</PendingSubmit>
  );
  const button = screen.getByRole("button", { name: "Saving…" });
  expect(button).toBeDisabled();
  expect(button).toHaveClass("inline-flex", "items-center", "gap-1.5");
  expect(button.querySelector('[aria-hidden="true"]')).toHaveClass(
    "inline-block",
    "h-4",
    "w-4",
    "animate-spin"
  );
});
