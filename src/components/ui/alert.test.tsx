import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert } from "./alert";

afterEach(cleanup);

describe("Alert", () => {
  it("announces errors with the shared banner treatment", () => {
    render(<Alert>This needs attention.</Alert>);

    expect(screen.getByRole("alert")).toHaveTextContent("This needs attention.");
    expect(screen.getByRole("alert")).toHaveClass("bg-danger/8", "ring-1");
  });

  it("announces success without error urgency", () => {
    render(<Alert variant="success">Saved.</Alert>);

    expect(screen.getByRole("status")).toHaveTextContent("Saved.");
  });
});
