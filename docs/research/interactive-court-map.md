# Interactive Cebu court map

## Decision

Use MapLibre GL directly through a small Relay-owned client component. Treat MapCN as a design and composition reference rather than copying its full registry component.

## Findings

- MapCN follows the shadcn model: its map component is copied into the application and owned by the product. It is built on MapLibre GL and allows access to the underlying map instance. It is not a map-data or tile provider. [MapCN documentation](https://www.mapcn.dev/docs) · [advanced usage](https://www.mapcn.dev/docs/advanced-usage)
- MapCN's default basemap uses CARTO. Its repository warns that commercial use of CARTO basemaps requires an appropriate license, so Relay should not silently adopt the default tiles. [MapCN repository](https://github.com/AnmolSaini16/mapcn)
- MapLibre GL exposes native map events and controls, including navigation controls, and supports Mapbox-style raster or vector sources. It is sufficient for pan, pinch/wheel zoom, fullscreen, bounds, markers, and list-to-map focus without another React wrapper. [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
- Geoapify publishes MapLibre-compatible styles and raster ZXY tiles. Its free plan requires visible Geoapify, OpenMapTiles, and OpenStreetMap attribution. [Geoapify map tiles](https://apidocs.geoapify.com/docs/maps/map-tiles/)
- MapCN recommends GeoJSON layers for hundreds or thousands of markers. Relay's Cebu pilot currently has only dozens, so DOM button markers are appropriate and preserve a direct accessible name and focus target. [MapCN advanced usage](https://www.mapcn.dev/docs/advanced-usage)
- Google exposes place results as a list beside the map and uses an info window anchored to a selected marker. Its info-window guidance treats the popup as a dialog, gives it a concise content area, supports an explicit close action, and returns focus to the previous control when closed. [Google Place List](https://developers.google.com/maps/documentation/javascript/places-ui-kit/place-list) · [Google info windows](https://developers.google.com/maps/documentation/javascript/infowindows)
- Apple's map guidance describes maps as familiar pan-and-zoom surfaces that may include annotations and overlays. Relay should preserve those platform expectations rather than inventing custom map gestures. [Apple Human Interface Guidelines: Maps](https://developer.apple.com/design/human-interface-guidelines/maps)

## Relay implementation

- Lazy-load `maplibre-gl` only on the court finder.
- Use a minimal Relay-owned component instead of MapCN's broad registry file.
- Keep the searchable court list as the canonical keyboard and screen-reader path; the map is an additional spatial control. On desktop, an independently scrollable results rail sits on the left and the dominant map sits on the right. On mobile, the map leads and the results follow as a bounded list.
- Selecting either a marker or result synchronizes both surfaces, focuses the map, scrolls the result into view, and opens one concise court overlay with Create game, directions, booking/details, copy, and close actions.
- Proxy raster tiles through a route restricted to tile coordinates intersecting Cebu. This keeps the existing Geoapify key server-only and limits the proxy's useful geography.
- Cache tiles at the server and CDN boundary.
- Use cooperative gestures so one-finger page scrolling remains usable on phones; pinch and explicit zoom controls remain available.
- Preserve visible attribution inside the map and avoid implying live availability.

## Revisit threshold

Move markers to a GeoJSON canvas layer and add clustering only if the directory grows into hundreds of visible points. Consider a dedicated public browser key only if direct provider delivery becomes necessary for scale and it can be restricted by production origin and quota.
