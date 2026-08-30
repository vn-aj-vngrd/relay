import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicQuickPlay } from "./public-quick-play";

describe("PublicQuickPlay", () => {
  it("starts a public doubles game and supports scoring and undo", () => {
    render(<PublicQuickPlay />);

    fireEvent.click(screen.getByRole("button", { name: "Start doubles" }));
    expect(screen.getByRole("heading", { name: "Quick Play" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add one point to side 1" }));
    expect(screen.getByLabelText("Side 1 score 1")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByLabelText("Side 1 score 0")).toHaveTextContent("0");
  });

  it("validates unique player names before starting", () => {
    render(<PublicQuickPlay />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "Player 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Start doubles" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use a different name for each player.");
  });

  it("supports a two-player singles setup", () => {
    render(<PublicQuickPlay />);
    fireEvent.click(screen.getByRole("radio", { name: /Singles/ }));
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Start singles" }));
    expect(screen.getByLabelText("Side 1")).toHaveTextContent("Player 1");
    expect(screen.getByLabelText("Side 2")).toHaveTextContent("Player 2");
  });
});
