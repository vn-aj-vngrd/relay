import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentAnswer } from "./answer";

describe("untrusted Agent answers", () => {
  it("formats emphasis, lists, headings, code and tables", () => {
    const { container } = render(
      <AgentAnswer
        text={
          "## Next game\n\n**Saturday** with *friends*.\n\n- Bring a paddle\n- Be on time\n\n`inline`\n\n```text\ncode sample\n```\n\n| Game | Time |\n| --- | --- |\n| Saturday | 7 PM |"
        }
      />
    );
    expect(
      screen.getByRole("heading", { name: "Next game" })
    ).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("Saturday");
    expect(container.querySelector("em")).toHaveTextContent("friends");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("pre code")).toHaveTextContent(
      "code sample"
    );
    expect(screen.getByRole("table")).toHaveTextContent("7 PM");
  });
  it("never loads Markdown images or renders embedded controls", () => {
    const { container } = render(
      <AgentAnswer
        text={
          "![tracking](https://evil.test/pixel)\n\n<script>alert(1)</script>\n\n- [ ] Task"
        }
      />
    );
    expect(container.querySelector("img,script,input")).toBeNull();
  });
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
  it("supports safe Court Finder detail links", () => {
    render(<AgentAnswer text="[Court](/courts/cebu-court)" />);
    expect(screen.getByRole("link", { name: "Court" })).toHaveAttribute(
      "href",
      "/courts/cebu-court"
    );
  });
  it("supports source links to Help Center", () => {
    render(<AgentAnswer text="Read [Create a game](/help/create-game)." />);
    expect(screen.getByRole("link", { name: "Create a game" })).toHaveAttribute(
      "href",
      "/help/create-game"
    );
  });
});
