import { FullscreenControl } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import { createMobileSafeFullscreenControl } from "./cebu-court-map";

describe("createMobileSafeFullscreenControl", () => {
  it("uses pseudo fullscreen when mobile WebKit exposes an unusable fullscreen method", () => {
    const mapContainer = document.createElement("div");
    const shell = document.createElement("div");
    Object.defineProperty(mapContainer, "webkitRequestFullscreen", { value: vi.fn() });
    const resize = vi.fn();
    const control = createMobileSafeFullscreenControl(FullscreenControl, shell);
    const controlElement = control.onAdd({
      getContainer: () => mapContainer,
      _getUIString: (key: string) => key,
      cooperativeGestures: {
        isEnabled: () => false,
        disable: vi.fn(),
        enable: vi.fn(),
      },
      resize,
    } as never);

    controlElement.querySelector<HTMLButtonElement>("button")?.click();

    expect(shell).toHaveClass("maplibregl-pseudo-fullscreen");
    expect(mapContainer).not.toHaveClass("maplibregl-pseudo-fullscreen");
    expect(resize).toHaveBeenCalledOnce();
  });
});
