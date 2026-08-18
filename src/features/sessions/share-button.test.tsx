import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShareButton } from "./share-button";

describe("ShareButton", () => {
  it("uses the standard secondary action treatment and consistent label", () => {
    render(<ShareButton url="/s/friends-night" title="Friends Night" />);
    expect(screen.getByRole("button", { name: "Share game" })).toHaveClass("min-h-9", "text-[13px]", "bg-surface");
  });
});
