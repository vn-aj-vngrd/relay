import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, ButtonLink, ButtonSpinner } from "./button";

describe("button primitives", () => {
  it("uses native button semantics and supports disabled state", () => {
    render(<Button disabled>Publish game</Button>);
    expect(screen.getByRole("button", { name: "Publish game" })).toBeDisabled();
  });
  it("uses a link for navigation", () => {
    render(<ButtonLink href="/games/new">Create game</ButtonLink>);
    expect(screen.getByRole("link", { name: "Create game" })).toHaveAttribute(
      "href",
      "/games/new"
    );
  });
  it("isolates external tabs by default", () => {
    render(
      <ButtonLink href="https://example.com" target="_blank">
        External venue
      </ButtonLink>
    );
    expect(
      screen.getByRole("link", { name: "External venue" })
    ).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("keeps default actions compact and exposes one consistent large size", () => {
    render(
      <>
        <Button>Compact action</Button>
        <Button size="large">Large action</Button>
      </>
    );
    expect(screen.getByRole("button", { name: "Compact action" })).toHaveClass(
      "min-h-9",
      "items-center",
      "justify-center",
      "leading-none"
    );
    expect(screen.getByRole("button", { name: "Large action" })).toHaveClass(
      "min-h-10"
    );
  });
  it("keeps the loading spinner decorative", () => {
    const { container } = render(
      <Button>
        <ButtonSpinner />
        Signing in…
      </Button>
    );
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeVisible();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
