import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { prepareAdminMfaAction } = vi.hoisted(() => ({
  prepareAdminMfaAction: vi.fn().mockResolvedValue({
    ok: true,
    factorId: "00000000-0000-4000-8000-000000000001",
    enrolled: false,
    qrCode:
      'data:image/svg+xml;utf-8,<?xml version="1.0"?>\n<svg width="231" height="231">\n</svg>\n',
    secret: "ABC123",
  }),
}));

vi.mock("./admin-mfa-actions", () => ({
  prepareAdminMfaAction,
  verifyAdminMfaAction: vi.fn(),
}));

import { AdminMfaSetup } from "./admin-mfa-setup";

afterEach(() => {
  cleanup();
  prepareAdminMfaAction.mockClear();
});

describe("AdminMfaSetup", () => {
  it("prepares enrollment once when React replays effects", async () => {
    render(
      <div>
        <AdminMfaSetup />
      </div>,
      { reactStrictMode: true }
    );

    const qrCode = await screen.findByAltText(
      "QR code for the Relay administrator authenticator"
    );
    expect(qrCode).toBeVisible();
    expect(qrCode.getAttribute("src")).not.toMatch(/[\n\r]/);
    expect(qrCode.getAttribute("src")).toContain("%3Csvg%20width%3D%22231%22");
    await waitFor(() => expect(prepareAdminMfaAction).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(/could not be prepared/i)
    ).not.toBeInTheDocument();
  });
});
