import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentAnswer } from "./answer";

describe("untrusted Agent answers", () => {
  it("renders HTML and unsafe/external links as inert text", () => {
    const { container } = render(
      <AgentAnswer
        text={
          "<img src=x onerror=alert(1)> [bad](javascript:alert) [external](https://evil.test)"
        }
      />
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
  it.each([
    "[Source](//evil.example)",
    "[Source](/admin)",
    "[Source](/help/guide?redirect=https://evil.example)",
  ])("keeps non-allowlisted link %s inert", (text) => {
    const { container } = render(<AgentAnswer text={text} />);
    expect(container.querySelector("a")).toBeNull();
  });
  it("supports source links to Help Center", () => {
    render(<AgentAnswer text="Read [Create a game](/help/create-game)." />);
    expect(screen.getByRole("link", { name: "Create a game" })).toHaveAttribute(
      "href",
      "/help/create-game"
    );
  });
});
