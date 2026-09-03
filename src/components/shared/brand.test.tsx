import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Brand, RelayMark } from "./brand";

describe("Relay brand", () => {
  it("uses the freestanding signal ball in the wordmark", () => {
    const { container } = render(<Brand />);
    expect(screen.getByRole("link", { name: "Relay home" })).toHaveTextContent(
      "Relay"
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toHaveClass(
      "rounded-full",
      "bg-signal"
    );
  });

  it("scales the same mark without changing its shape", () => {
    const { container } = render(<RelayMark className="h-8 w-8" />);
    expect(container.firstChild).toHaveClass("h-8", "w-8", "rounded-full");
  });
});
