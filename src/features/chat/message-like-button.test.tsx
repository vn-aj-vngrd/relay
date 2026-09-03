import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ toggle: vi.fn() }));
vi.mock("./actions", () => ({ toggleMessageReaction: mocks.toggle }));

import { MessageLikeButton } from "./message-like-button";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.toggle.mockReset();
});

describe("MessageLikeButton", () => {
  it("shows a like immediately while the server action is pending", async () => {
    const action = deferred();
    mocks.toggle.mockReturnValue(action.promise);
    render(<MessageLikeButton messageId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" liked={false} count={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Like message" }));

    const unlike = screen.getByRole("button", { name: "Remove like" });
    expect(unlike).toHaveAttribute("aria-pressed", "true");
    expect(unlike).toHaveTextContent("2");
    expect(unlike).toBeEnabled();
    expect(unlike).toHaveAttribute("aria-busy", "true");

    await act(async () => action.resolve());
  });

  it("shows an unlike immediately while the server action is pending", async () => {
    const action = deferred();
    mocks.toggle.mockReturnValue(action.promise);
    render(<MessageLikeButton messageId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" liked count={2} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove like" }));

    const like = screen.getByRole("button", { name: "Like message" });
    expect(like).toHaveAttribute("aria-pressed", "false");
    expect(like).toHaveTextContent("1");

    await act(async () => action.resolve());
  });

  it("allows another optimistic toggle before the previous request settles", async () => {
    const action = deferred();
    mocks.toggle.mockReturnValue(action.promise);
    render(<MessageLikeButton messageId="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" liked={false} count={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Like message" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove like" }));

    const like = screen.getByRole("button", { name: "Like message" });
    expect(like).toHaveTextContent("1");
    expect(like).toBeEnabled();
    expect(mocks.toggle).toHaveBeenCalledTimes(2);

    await act(async () => action.resolve());
  });
});
