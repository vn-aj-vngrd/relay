import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IconTooltip } from "./icon-tooltip";

describe("IconTooltip", () => {
  it("supports an accessible description for longer contextual help", () => {
    render(
      <IconTooltip id="coverage-help" label="Coverage is currently limited.">
        <button type="button" aria-describedby="coverage-help">
          Help
        </button>
      </IconTooltip>,
    );

    expect(screen.getByRole("button", { name: "Help" })).toHaveAttribute("aria-describedby", "coverage-help");
    expect(screen.getByRole("tooltip")).toHaveAttribute("id", "coverage-help");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Coverage is currently limited.");
  });
});
