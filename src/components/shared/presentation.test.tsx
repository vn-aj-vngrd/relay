import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarStack } from "./avatar-stack";
import { Status } from "./status";

describe("shared presentation", () => {
  it("builds stable initials and exposes the full player name", () => {
    render(<Avatar name="Mika Reyes" />);
    expect(screen.getByLabelText("Mika Reyes")).toHaveTextContent("MR");
  });
  it("announces the total roster size", () => {
    render(<AvatarStack names={["Van", "AJ"]} total={5} />);
    expect(screen.getByLabelText("5 players")).toHaveTextContent("+3");
  });
  it("pairs semantic status color with readable text", () => {
    render(<Status kind="confirmed" />);
    expect(screen.getByText("Court confirmed")).toBeVisible();
  });
});
