import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ sendMessage: vi.fn(async () => ({})) }));

import { ChatComposer } from "./chat-composer";

afterEach(cleanup);

describe("ChatComposer", () => {
  it("supports text and one visible image attachment", () => {
    render(<ChatComposer sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);
    const composer = screen.getByPlaceholderText("Message the group…");
    expect(composer).toHaveAttribute("maxlength", "1000");
    expect(composer.tagName).toBe("TEXTAREA");
    expect(composer).toHaveAttribute("enterkeyhint", "send");
    const image = new File(["image"], "arrival.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Attach a photo/), {
      target: { files: [image] },
    });
    expect(screen.getByText(/arrival.jpg/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("grows with the message and keeps long drafts internally scrollable", () => {
    render(<ChatComposer sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);
    const composer = screen.getByPlaceholderText("Message the group…");
    Object.defineProperty(composer, "scrollHeight", {
      configurable: true,
      value: 160,
    });

    fireEvent.input(composer);

    expect(composer).toHaveStyle({ height: "128px", overflowY: "auto" });
  });

  it("sends with Enter and keeps Shift+Enter for a new line", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    render(<ChatComposer sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);
    const composer = screen.getByPlaceholderText("Message the group…");

    fireEvent.keyDown(composer, { key: "Enter", shiftKey: true });
    expect(requestSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(composer, { key: "Enter" });
    expect(requestSubmit).toHaveBeenCalledOnce();
  });

  it("rejects an image above the configured limit before upload", () => {
    render(
      <ChatComposer
        sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7"
        maxImageBytes={1024}
      />
    );
    const image = new File([new Uint8Array(1025)], "large.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(screen.getByLabelText(/Attach a photo/), {
      target: { files: [image] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a photo no larger than 1 KB."
    );
    expect(screen.queryByText(/large.jpg/)).not.toBeInTheDocument();
  });
});
