import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentChatSkeleton } from "./chat-skeleton";

describe("Agent chat restoration", () => {
  it("shows one progress label without a spinner or placeholder messages", () => {
    const { container } = render(<AgentChatSkeleton />);
    const status = screen.getByRole("status", { name: "Restoring chat" });
    expect(status).toHaveTextContent("Restoring chat…");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector(".animate-spin, .animate-pulse")).toBeNull();
  });
});
