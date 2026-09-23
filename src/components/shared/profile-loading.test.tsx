import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHeaderSkeleton } from "@/app/(app)/profile/[username]/profile-loading";

describe("profile header loading", () => {
  it("announces loading without adding a visible spinner or label", () => {
    const { container } = render(<ProfileHeaderSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveClass("sr-only");
    expect(status).toHaveTextContent("Loading player details");
    expect(screen.getByLabelText("Loading player details")).toHaveAttribute(
      "aria-busy",
      "true"
    );
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });
});
