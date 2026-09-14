import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { uploadMemoryPhotoState } from "./actions";
import { MemoryPhotoForm } from "./memory-photo-form";

vi.mock("./actions", () => ({ uploadMemoryPhotoState: vi.fn() }));

beforeEach(() => vi.mocked(uploadMemoryPhotoState).mockReset());

it("confirms a saved photo and explains where it can be used", async () => {
  vi.mocked(uploadMemoryPhotoState).mockResolvedValue({ success: true });
  render(<MemoryPhotoForm sessionId="game" />);
  expect(screen.getByText(/shared album using the host/)).toBeVisible();
  fireEvent.submit(screen.getByRole("form", { name: "Add a game photo" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Photo added. It’s ready to use in Make."
  );
});

it("retains the caption and offers retry when adding a photo fails", async () => {
  vi.mocked(uploadMemoryPhotoState).mockResolvedValue({
    error: "Photo storage is full.",
  });
  render(<MemoryPhotoForm sessionId="game" />);
  fireEvent.change(screen.getByLabelText(/Caption/), {
    target: { value: "Our Saturday crew" },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Add a game photo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Photo storage is full."
  );
  // The alert can render before the effect restores uncontrolled inputs.
  await waitFor(() => {
    expect(screen.getByLabelText(/Caption/)).toHaveValue("Our Saturday crew");
  });
  expect(screen.getByRole("button", { name: "Add to memory" })).toBeEnabled();
  expect(screen.queryByRole("status")).toBeNull();
});

it.each([
  [50, 0, "This album is full"],
  [30, 250 * 1024 * 1024, "The host’s storage is full"],
] as const)(
  "blocks uploading at %i photos and %i bytes with the right explanation",
  (photosUsed, bytesUsed, message) => {
    render(
      <MemoryPhotoForm
        sessionId="game"
        allowance={{
          photosUsed,
          photoLimit: 50,
          bytesUsed,
          storageBytes: 250 * 1024 * 1024,
          storageUnlimited: false,
        }}
      />
    );
    expect(
      screen.getByRole("button", { name: "Add to memory" })
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(
      screen.getByText(/only the hosted-game allowance does/)
    ).not.toBeVisible();
    expect(screen.queryByRole("link", { name: "View plans" })).toBeNull();
  }
);

it("allows uploads below both limits without promoting plans", () => {
  render(
    <MemoryPhotoForm
      sessionId="game"
      canManageStorage
      allowance={{
        photosUsed: 49,
        photoLimit: 50,
        bytesUsed: 100,
        storageBytes: 250 * 1024 * 1024,
        storageUnlimited: false,
      }}
    />
  );
  expect(screen.getByText("49 / 50 game photos")).toBeVisible();
  expect(screen.getByRole("button", { name: "Add to memory" })).toBeEnabled();
  expect(screen.queryByRole("link", { name: "View plans" })).toBeNull();
});

it.each([
  [false, 79, false],
  [false, 80, true],
  [false, 100, true],
  [true, 100, false],
] as const)(
  "offers plans only near a finite storage limit (%s, %i)",
  (storageUnlimited, bytesUsed, showPlans) => {
    render(
      <MemoryPhotoForm
        sessionId="game"
        canManageStorage
        allowance={{
          photosUsed: 2,
          photoLimit: 50,
          bytesUsed,
          storageBytes: 100,
          storageUnlimited,
        }}
      />
    );
    expect(Boolean(screen.queryByRole("link", { name: "View plans" }))).toBe(
      showPlans
    );
    const details = screen
      .getByText("How photo limits work")
      .closest("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(details).toContainElement(
      screen.getByText(/only the hosted-game allowance does/)
    );
  }
);
