import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ updateGroupAction: vi.fn(async () => ({})) }));

import { EditGroupForm } from "./edit-group-form";

const group = {
  id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  slug: "tuesday-dink-club",
  name: "Tuesday Dink Club",
  description: "The regular crew.",
};

describe("EditGroupForm", () => {
  it("edits group details and can remove the current group photo", () => {
    const { container } = render(
      <EditGroupForm
        group={group}
        imageUrl="https://relay.supabase.co/storage/v1/object/public/avatars/owner/group.webp"
      />,
    );

    expect(screen.getByRole("textbox", { name: "Group name" })).toHaveValue("Tuesday Dink Club");
    expect(screen.getByRole("textbox", { name: /Description/ })).toHaveValue("The regular crew.");
    const preview = screen.getByRole("img", { name: "Group photo preview" });
    expect(preview).toBeVisible();
    expect(preview.parentElement).toHaveClass("rounded-full");

    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));

    expect(screen.queryByRole("img", { name: "Group photo preview" })).not.toBeInTheDocument();
    expect(container.querySelector('input[name="removeImage"]')).toHaveValue("true");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
  });
});
