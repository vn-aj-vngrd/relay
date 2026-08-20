import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstallAppControl } from "./install-app-control";

afterEach(() => {
  window.__relayInstallPrompt = undefined;
});

describe("InstallAppControl", () => {
  it("uses the captured browser install prompt", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    window.__relayInstallPrompt = {
      preventDefault: vi.fn(),
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    } as unknown as Window["__relayInstallPrompt"];

    render(<InstallAppControl />);
    fireEvent.click(screen.getByRole("button", { name: "Install Relay" }));

    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    expect(await screen.findByText("Relay was added to this device.")).toBeVisible();
  });

  it("shows platform-neutral manual guidance when no prompt is available", () => {
    render(<InstallAppControl />);
    expect(screen.getByText(/Use your browser menu/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Install Relay" })).not.toBeInTheDocument();
  });
});
