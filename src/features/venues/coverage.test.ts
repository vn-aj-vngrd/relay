import { describe, expect, it } from "vitest";

import { courtDirectoryCoverage } from "./coverage";

function coordinateToTile(longitude: number, latitude: number, zoom: number) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const scale = 2 ** zoom;
  return {
    x: Math.floor(((longitude + 180) / 360) * scale),
    y: Math.floor(((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale),
  };
}

describe("Court directory coverage", () => {
  it("contains locations across the Philippines but excludes other countries", () => {
    expect(courtDirectoryCoverage.contains({ latitude: 14.5995, longitude: 120.9842 })).toBe(true);
    expect(courtDirectoryCoverage.contains({ latitude: 10.3157, longitude: 123.8854 })).toBe(true);
    expect(courtDirectoryCoverage.contains({ latitude: 7.0731, longitude: 125.6128 })).toBe(true);
    expect(courtDirectoryCoverage.contains({ latitude: 35.6762, longitude: 139.6503 })).toBe(false);
  });

  it("returns field-specific publishing issues", () => {
    expect(courtDirectoryCoverage.validatePublishingCoordinate({ latitude: "", longitude: "" })).toEqual([
      { path: "latitude", message: "Add a Philippines latitude before publishing." },
      { path: "longitude", message: "Add a Philippines longitude before publishing." },
    ]);
    expect(courtDirectoryCoverage.validatePublishingCoordinate({ latitude: 35.68, longitude: 139.69 })).toEqual([
      { path: "latitude", message: "Latitude must be inside the Philippines." },
      { path: "longitude", message: "Longitude must be inside the Philippines." },
    ]);
  });

  it("allows map tiles across the supported country", () => {
    for (const [longitude, latitude] of [
      [123.91, 10.34],
      [120.9842, 14.5995],
      [125.6128, 7.0731],
    ]) {
      const tile = coordinateToTile(longitude, latitude, 12);
      expect(courtDirectoryCoverage.allowsTile({ zoom: 12, ...tile })).toBe(true);
    }
  });

  it("rejects distant, malformed, and excessive tile requests", () => {
    const tokyo = coordinateToTile(139.6917, 35.6895, 12);
    expect(courtDirectoryCoverage.allowsTile({ zoom: 12, ...tokyo })).toBe(false);
    expect(courtDirectoryCoverage.allowsTile({ zoom: 4, x: 0, y: 0 })).toBe(false);
    expect(courtDirectoryCoverage.allowsTile({ zoom: 19, x: 0, y: 0 })).toBe(false);
    expect(courtDirectoryCoverage.allowsTile({ zoom: 12, x: -1, y: 0 })).toBe(false);
  });

  it("provides a viewport that encloses covered cities", () => {
    const map = courtDirectoryCoverage.mapViewport();
    expect(map.minZoom).toBeLessThan(map.zoom);
    expect(map.maxZoom).toBeGreaterThan(map.zoom);
    expect(map.maxBounds[0][0]).toBeLessThan(120.9842);
    expect(map.maxBounds[1][0]).toBeGreaterThan(125.6128);
  });
});
