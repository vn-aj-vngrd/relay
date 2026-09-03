import { describe, expect, it } from "vitest";

import {
  buildCourtOperatingHours,
  formatCourtOperatingHours,
  formatCourtParking,
  formatCourtPrice,
  isCourtOpen24Hours,
  isCourtOpenAt,
  isCourtOpenDuring,
  isCourtOpenDuringOnDay,
  pesosToCents,
  toCourtPriceStorage,
} from "./details";

describe("structured court details", () => {
  it("formats structured prices and ranges in Philippine pesos", () => {
    expect(
      formatCourtPrice({
        priceStatus: "paid",
        priceAmountCents: 50000,
        priceMaxCents: 65000,
        priceUnit: "court_hour",
      })
    ).toBe("₱500–₱650 per court per hour");
    expect(
      formatCourtPrice({
        priceStatus: "free",
        priceAmountCents: 0,
        priceMaxCents: null,
        priceUnit: null,
      })
    ).toBe("Free");
    expect(
      formatCourtPrice({
        priceStatus: "contact",
        priceAmountCents: null,
        priceMaxCents: null,
        priceUnit: null,
      })
    ).toBe("Ask the court");
  });

  it("stores only fields allowed by the selected pricing status", () => {
    expect(
      toCourtPriceStorage({
        priceStatus: "free",
        priceAmount: "",
        priceMax: "",
        priceUnit: "",
      })
    ).toEqual({
      priceStatus: "free",
      priceAmountCents: 0,
      priceMaxCents: null,
      priceUnit: null,
    });
    expect(
      toCourtPriceStorage({
        priceStatus: "paid",
        priceAmount: 450.5,
        priceMax: 600,
        priceUnit: "hour",
      })
    ).toEqual({
      priceStatus: "paid",
      priceAmountCents: 45050,
      priceMaxCents: 60000,
      priceUnit: "hour",
    });
  });

  it("formats parking status and converts submitted pesos to centavos", () => {
    expect(formatCourtParking("unavailable")).toBe("Not available");
    expect(pesosToCents(450.5)).toBe(45050);
    expect(pesosToCents("")).toBeNull();
  });

  it("builds filterable Philippine operating hours", () => {
    const operatingHours = buildCourtOperatingHours({
      mondayOpen: "06:00",
      mondayClose: "22:00",
      saturdayOpen: "08:00",
      saturdayClose: "20:00",
    });
    expect(formatCourtOperatingHours(operatingHours)).toBe(
      "Mon 6:00 AM–10:00 PM; Sat 8:00 AM–8:00 PM"
    );
    expect(
      isCourtOpenAt(operatingHours, new Date("2026-09-07T04:00:00.000Z"))
    ).toBe(true);
    expect(
      isCourtOpenAt(operatingHours, new Date("2026-09-07T15:00:00.000Z"))
    ).toBe(false);
    expect(
      isCourtOpenDuring(
        operatingHours,
        "08:00",
        "20:00",
        new Date("2026-09-07T04:00:00.000Z")
      )
    ).toBe(true);
    expect(
      isCourtOpenDuring(
        operatingHours,
        "20:00",
        "23:00",
        new Date("2026-09-07T04:00:00.000Z")
      )
    ).toBe(false);
    expect(isCourtOpenDuringOnDay(operatingHours, "08:00", "20:00", 1)).toBe(
      true
    );
    expect(isCourtOpenDuringOnDay(operatingHours, "08:00", "20:00", 2)).toBe(
      false
    );
    expect(isCourtOpen24Hours(operatingHours)).toBe(false);
    expect(
      isCourtOpen24Hours(
        Array.from({ length: 7 }, (_, index) => ({
          dayOfWeek: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          opensAt: "00:00",
          closesAt: "00:00",
        }))
      )
    ).toBe(true);
    expect(isCourtOpenAt([])).toBeNull();
  });
});
