import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicSessionHeader } from "./public-session-header";
import { PublicSessionNav } from "./public-session-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/s/saturday-night-pickle/play",
}));

describe("PublicSessionNav", () => {
  it("uses the same session destinations as the account workspace", () => {
    render(<PublicSessionNav slug="saturday-night-pickle" inline />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Overview",
      "Players",
      "Play",
      "Chat",
      "Payments",
    ]);
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/s/saturday-night-pickle/play");
  });

  it("scopes the active state to the session accent", () => {
    const { container } = render(<PublicSessionHeader slug="saturday-night-pickle" signedIn={false} accentColor="coral" />);

    expect(container.querySelector<HTMLElement>(".app-chrome")?.style.getPropertyValue("--primary")).toContain("#bd4545");
  });
});
