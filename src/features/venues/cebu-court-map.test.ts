import { describe, expect, it } from "vitest";

import { collapseAttributionControl } from "./cebu-court-map";

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
