import { describe, expect, it } from "vitest";

import { distanceInKilometers, formatDistance } from "./distance";

describe("venue distance", () => {
  it("calculates practical local distances", () => {
    const distance = distanceInKilometers(
      { latitude: 10.3157, longitude: 123.8854 },
      { latitude: 10.294, longitude: 123.902 },
    );
    expect(distance).toBeGreaterThan(2);
    expect(distance).toBeLessThan(4);
  });

  it("formats nearby courts without false precision", () => {
    expect(formatDistance(0.04)).toBe("0.1 km");
    expect(formatDistance(2.46)).toBe("2.5 km");
  });
});
