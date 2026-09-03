import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImageFileField } from "./image-file-field";

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: vi.fn(() => "blob:preview"),
});
Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: vi.fn(),
});
afterEach(cleanup);

describe("ImageFileField", () => {
  it("replaces the native chooser with a clear image selection control", () => {
    render(
      <ImageFileField
        id="proof"
        name="proof"
        label="Payment screenshot"
        hint="One image, up to 5 MB."
        required
      />
    );
    const input = screen.getByLabelText("Payment screenshot");
    expect(input).toHaveClass("sr-only");
    expect(screen.getByText("Choose screenshot")).toBeVisible();
    fireEvent.change(input, {
      target: {
        files: [new File(["image"], "gcash.png", { type: "image/png" })],
      },
    });
    expect(screen.getByText("gcash.png")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove gcash.png" })
    ).toBeVisible();
  });
});
