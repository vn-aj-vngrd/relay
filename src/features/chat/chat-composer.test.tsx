import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ sendMessage: vi.fn(async () => ({})) }));

import { ChatComposer } from "./chat-composer";

afterEach(cleanup);

describe("ChatComposer", () => {
  it("supports text and one visible image attachment", () => {
    render(<ChatComposer sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" />);
    expect(screen.getByPlaceholderText("Message the group")).toHaveAttribute("maxlength", "1000");
    const image = new File(["image"], "arrival.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Attach a photo/), { target: { files: [image] } });
    expect(screen.getByText(/arrival.jpg/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("rejects an image above the configured limit before upload", () => {
    render(<ChatComposer sessionId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" maxImageBytes={1024} />);
    const image = new File([new Uint8Array(1025)], "large.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Attach a photo/), { target: { files: [image] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a photo no larger than 1 KB.");
    expect(screen.queryByText(/large.jpg/)).not.toBeInTheDocument();
  });
});
