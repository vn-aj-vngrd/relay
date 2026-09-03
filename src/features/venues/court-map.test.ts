import { describe, expect, it } from "vitest";

import { clusterCourtListings, collapseAttributionControl } from "./court-map";
import type { CourtListing } from "./directory";

describe("court map data", () => {
  it("clusters nearby courts at regional zoom and separates them when zoomed in", () => {
    const courts = [
      { id: "cebu-a", longitude: 123.9, latitude: 10.3 },
      { id: "cebu-b", longitude: 123.91, latitude: 10.31 },
      { id: "manila", longitude: 121, latitude: 14.6 },
    ] as CourtListing[];

    const regional = clusterCourtListings(courts, 8);
    expect(regional).toHaveLength(2);
    expect(regional.find((group) => group.venues.length === 2)).toMatchObject({
      latitude: 10.305,
      longitude: 123.905,
    });
    expect(clusterCourtListings(courts, 12)).toHaveLength(3);
  });
});

describe("collapseAttributionControl", () => {
  it("keeps map attribution available but closed initially", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <details class="maplibregl-ctrl-attrib maplibregl-compact maplibregl-compact-show" open>
        <summary class="maplibregl-ctrl-attrib-button">Map information</summary>
        <div class="maplibregl-ctrl-attrib-inner">Geoapify · OpenStreetMap</div>
      </details>
    `;

    collapseAttributionControl(container);

    const attribution = container.querySelector<HTMLDetailsElement>(".maplibregl-ctrl-attrib");
    expect(attribution).not.toHaveAttribute("open");
    expect(attribution).not.toHaveClass("maplibregl-compact-show");
    expect(attribution).toHaveTextContent("Geoapify · OpenStreetMap");
  });
});
