import { describe, expect, it } from "vitest";

import { isValidPhilippinesTile } from "./tile-boundary";

function coordinateToTile(longitude: number, latitude: number, zoom: number) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const scale = 2 ** zoom;
  return {
    x: Math.floor(((longitude + 180) / 360) * scale),
    y: Math.floor(((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale),
  };
}

describe("Philippines tile boundary", () => {
  it("allows tiles across the supported country at interactive zoom levels", () => {
    const cebu = coordinateToTile(123.91, 10.34, 12);
    const manila = coordinateToTile(120.9842, 14.5995, 12);
    const davao = coordinateToTile(125.6128, 7.0731, 12);
    expect(isValidPhilippinesTile(12, cebu.x, cebu.y)).toBe(true);
    expect(isValidPhilippinesTile(12, manila.x, manila.y)).toBe(true);
    expect(isValidPhilippinesTile(12, davao.x, davao.y)).toBe(true);
  });

  it("rejects distant, malformed, and excessive tile requests", () => {
    const tokyo = coordinateToTile(139.6917, 35.6895, 12);
    expect(isValidPhilippinesTile(12, tokyo.x, tokyo.y)).toBe(false);
    expect(isValidPhilippinesTile(4, 0, 0)).toBe(false);
    expect(isValidPhilippinesTile(19, 0, 0)).toBe(false);
    expect(isValidPhilippinesTile(12, -1, 0)).toBe(false);
  });
});
