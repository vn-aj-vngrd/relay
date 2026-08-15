import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "./button";

describe("button primitives", () => {
  it("uses native button semantics and supports disabled state", () => {
    render(<Button disabled>Publish game</Button>);
    expect(screen.getByRole("button", { name: "Publish game" })).toBeDisabled();
  });
  it("uses a link for navigation", () => {
    render(<ButtonLink href="/games/new">Create game</ButtonLink>);
    expect(screen.getByRole("link", { name: "Create game" })).toHaveAttribute("href", "/games/new");
  });
});
