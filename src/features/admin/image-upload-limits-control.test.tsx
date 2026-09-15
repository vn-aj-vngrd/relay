import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { updateImageUploadLimitsAction } from "./image-upload-limits-action";
import { ImageUploadLimitsControl } from "./image-upload-limits-control";

vi.mock("./image-upload-limits-action", () => ({
  updateImageUploadLimitsAction: vi.fn(),
}));

beforeEach(() => vi.mocked(updateImageUploadLimitsAction).mockReset());

it("shows independent saved sizes and confirms a successful save", async () => {
  vi.mocked(updateImageUploadLimitsAction).mockResolvedValue({
    success: "Photo limits saved: chat 3 MiB, album 4 MiB.",
  });
  render(
    <ImageUploadLimitsControl
      chatImageMaxBytes={3 * 1024 * 1024}
      memoryImageMaxBytes={4 * 1024 * 1024}
    />
  );
  expect(screen.getByLabelText("Chat photo (MiB)")).toHaveValue(3);
  expect(screen.getByLabelText("Album photo (MiB)")).toHaveValue(4);
  fireEvent.click(screen.getByRole("button", { name: "Save photo limits" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Photo limits saved"
  );
});

it("preserves edited values and reports failed saves", async () => {
  vi.mocked(updateImageUploadLimitsAction).mockResolvedValue({
    error: "Try again.",
  });
  render(
    <ImageUploadLimitsControl
      chatImageMaxBytes={1024 * 1024}
      memoryImageMaxBytes={2 * 1024 * 1024}
    />
  );
  fireEvent.change(screen.getByLabelText("Album photo (MiB)"), {
    target: { value: "4" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save photo limits" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Try again.");
  await waitFor(() =>
    expect(screen.getByLabelText("Album photo (MiB)")).toHaveValue(4)
  );
});
