import { describe, expect, it } from "vitest";

import { isValidCebuTile } from "./tile-boundary";

function coordinateToTile(longitude: number, latitude: number, zoom: number) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const scale = 2 ** zoom;
  return {
    x: Math.floor(((longitude + 180) / 360) * scale),
    y: Math.floor(((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale),
  };
}

describe("Cebu tile boundary", () => {
  it("allows valid Cebu tiles at interactive zoom levels", () => {
    const tile = coordinateToTile(123.91, 10.34, 12);
    expect(isValidCebuTile(12, tile.x, tile.y)).toBe(true);
  });

  it("rejects distant, malformed, and excessive tile requests", () => {
    const manila = coordinateToTile(120.9842, 14.5995, 12);
    expect(isValidCebuTile(12, manila.x, manila.y)).toBe(false);
    expect(isValidCebuTile(7, 0, 0)).toBe(false);
    expect(isValidCebuTile(19, 0, 0)).toBe(false);
    expect(isValidCebuTile(12, -1, 0)).toBe(false);
  });
});
