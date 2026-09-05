import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canvasContext: {
    arc: vi.fn(),
    arcTo: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
    moveTo: vi.fn(),
    set fillStyle(_value: string) {},
    set font(_value: string) {},
    set textAlign(_value: CanvasTextAlign) {},
    set textBaseline(_value: CanvasTextBaseline) {},
  },
  toCanvas: vi.fn().mockResolvedValue(undefined),
  track: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("qrcode", () => ({ toCanvas: mocks.toCanvas }));
vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: mocks.track,
}));

import { GameQrShare } from "./game-qr-share";

beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => mocks.canvasContext),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    configurable: true,
    value: vi.fn((callback: BlobCallback) => {
      queueMicrotask(() => callback(new Blob(["qr"], { type: "image/png" })));
    }),
  });
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:qr"),
      revokeObjectURL: vi.fn(),
    })
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    () => undefined
  );
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const props = {
  url: "/s/friends-night",
  title: "Friends Night",
  details: "Aug 22 · 7:00–9:00 PM · Central Pickle",
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
};

describe("GameQrShare", () => {
  it("generates a scan-safe QR for the canonical shared-game URL only when opened", async () => {
    mocks.toCanvas.mockImplementationOnce(async (canvas: HTMLCanvasElement) => {
      canvas.width = 1024;
      canvas.height = 1024;
      canvas.style.width = "1024px";
      canvas.style.height = "1024px";
    });
    render(<GameQrShare {...props} />);
    expect(mocks.toCanvas).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Show QR" }));

    expect(
      await screen.findByRole("dialog", { name: "Scan to join Friends Night" })
    ).toBeVisible();
    await waitFor(() => expect(mocks.toCanvas).toHaveBeenCalledOnce());
    expect(mocks.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      "http://localhost:3000/s/friends-night",
      expect.objectContaining({
        width: 1024,
        margin: 4,
        errorCorrectionLevel: "M",
      })
    );
    const qr = screen.getByRole("img", { name: "QR code for Friends Night" });
    expect(qr).toBeVisible();
    expect(qr).toHaveStyle({ width: "100%", height: "100%" });
    expect(qr).toHaveAttribute("width", "1024");
    expect(qr).toHaveAttribute("height", "1024");
  });

  it("copies and downloads the QR while recording a successful share", async () => {
    render(<GameQrShare {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Show QR" }));
    await screen.findByRole("button", { name: "Download PNG" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PNG" })).toBeEnabled()
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "http://localhost:3000/s/friends-night"
      )
    );
    expect(mocks.track).toHaveBeenCalledWith({
      sessionId: props.sessionId,
      event: "invite_shared",
    });

    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    await waitFor(() =>
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
    );
    expect(mocks.canvasContext.fillText).toHaveBeenCalledWith(
      "Friends Night",
      80,
      220
    );
    expect(mocks.canvasContext.drawImage).toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it("supports contextual story copy while preserving the default scan copy", async () => {
    const { unmount } = render(<GameQrShare {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Show QR" }));
    expect(
      await screen.findByRole("dialog", { name: "Scan to join Friends Night" })
    ).toHaveTextContent("Scan to view and RSVP");
    unmount();

    render(
      <GameQrShare
        {...props}
        heading="Scan to open Friends Night"
        description="Open this game in Relay."
        scanLabel="Scan to open game"
        event="recap_shared"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Show QR" }));
    expect(
      await screen.findByRole("dialog", { name: "Scan to open Friends Night" })
    ).toHaveTextContent("Open this game in Relay.");
    expect(screen.getByText("Scan to open game")).toBeVisible();
  });

  it("keeps successful copy feedback when analytics fails", async () => {
    mocks.track.mockRejectedValueOnce(new Error("analytics unavailable"));
    render(<GameQrShare {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Show QR" }));
    await screen.findByRole("button", { name: "Copy link" });
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByText("Game link copied")).toBeVisible();
  });

  it("closes with a labeled keyboard-focusable action", async () => {
    render(<GameQrShare {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Show QR" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Close QR code" }));

    expect(dialog).not.toHaveAttribute("open");
  });
});
