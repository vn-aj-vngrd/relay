import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicSessionHeader } from "./public-session-header";

vi.mock("./public-session-nav", () => ({
  PublicSessionNav: () => <nav>Game tabs</nav>,
}));
vi.mock("@/features/sessions/game-status", () => ({
  GameStatusChip: () => <span>Unexpected header chip</span>,
}));
afterEach(cleanup);

describe("PublicSessionHeader status placement", () => {
  it("keeps shared game chrome for navigation rather than lifecycle presentation", () => {
    render(
      <PublicSessionHeader
        slug="friday"
        signedIn={false}
        gameTitle="Friday crew"
      />
    );
    expect(screen.getByText("Friday crew")).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=/s/friday"
    );
    expect(screen.getByRole("navigation")).toHaveTextContent("Game tabs");
    expect(
      screen.queryByText("Unexpected header chip")
    ).not.toBeInTheDocument();
  });
});
