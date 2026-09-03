import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicSessionHeader } from "./public-session-header";
import { PublicSessionNav } from "./public-session-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/s/saturday-night-pickle/play",
}));

describe("PublicSessionNav", () => {
  it("uses the same session destinations as the account workspace", () => {
    render(<PublicSessionNav slug="saturday-night-pickle" />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Overview",
      "Players",
      "Play",
      "Chat",
      "Payments",
      "Story",
    ]);
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/s/saturday-night-pickle/play");
    expect(screen.getByRole("link", { name: "Play" })).toHaveClass(
      "min-h-11",
      "px-3",
      "text-sm",
      "text-ink",
      "after:bg-primary",
    );
    const navigation = screen.getByRole("navigation", { name: "Game navigation" });
    expect(navigation).not.toHaveClass("border-b");
    expect(navigation.querySelector(".max-w-6xl > .border-b")).toHaveClass("border-line");
  });

  it("keeps Play as the live and completed result surface and links to Story", () => {
    render(<PublicSessionNav slug="saturday-night-pickle" />);
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/s/saturday-night-pickle/play");
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("href", "/s/saturday-night-pickle/story");
  });

  it("scopes the active state to the session accent", () => {
    const { container } = render(
      <PublicSessionHeader
        slug="saturday-night-pickle"
        signedIn={false}
        accentColor="coral"
        gameTitle="Saturday Night Pickle"
      />,
    );

    const gameTitle = screen.getByText("Saturday Night Pickle");
    expect(gameTitle).toBeVisible();
    expect(gameTitle).toHaveClass("truncate");
    expect(gameTitle.parentElement).toContainElement(screen.getByRole("link", { name: "Relay home" }));
    expect(screen.queryByText("Relay")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveClass(
      "border-transparent",
      "bg-transparent",
      "sm:border-line",
      "sm:bg-surface",
    );
    expect(container.querySelector<HTMLElement>("header.app-chrome")).not.toHaveClass("sticky");
    expect(screen.getByRole("navigation", { name: "Game navigation" }).parentElement).toHaveClass("sticky", "top-0");
    expect(container.querySelector<HTMLElement>(".app-chrome")?.style.getPropertyValue("--primary")).toContain(
      "#bd4545",
    );
  });
});
