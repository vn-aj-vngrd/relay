"use client";

import type { Map as MapLibreMap, Marker as MapLibreMarker, StyleSpecification } from "maplibre-gl";
import { type ReactNode, useEffect, useRef, useState } from "react";

import type { CebuVenue } from "./queries";
import { CEBU_TILE_BOUNDS } from "./tile-boundary";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type CebuCourtMapProps = {
  venues: CebuVenue[];
  selectedId: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect: (id: string) => void;
  children?: ReactNode;
  compactPreview?: boolean;
  mobileEdgeToEdge?: boolean;
};

function mapStyle(dark: boolean): StyleSpecification {
  const style = dark ? "dark-matter" : "osm-bright-grey";
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: [`/api/venues/tiles/{z}/{x}/{y}?style=${style}`],
        tileSize: 256,
        minzoom: 8,
        maxzoom: 18,
        attribution:
          '<a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}

function fitVenues(map: MapLibreMap, venues: CebuVenue[], immediate = false) {
  if (!venues.length) return;
  if (venues.length === 1) {
    map.easeTo({
      center: [venues[0].longitude, venues[0].latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: immediate || window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : 450,
    });
    return;
  }

  let west = venues[0].longitude;
  let east = venues[0].longitude;
  let south = venues[0].latitude;
  let north = venues[0].latitude;
  for (const venue of venues.slice(1)) {
    west = Math.min(west, venue.longitude);
    east = Math.max(east, venue.longitude);
    south = Math.min(south, venue.latitude);
    north = Math.max(north, venue.latitude);
  }
  map.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    {
      padding: { top: 64, right: 64, bottom: 64, left: 64 },
      maxZoom: 13,
      duration: immediate || window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : 450,
    },
  );
}

function setMarkerState(element: HTMLButtonElement, active: boolean) {
  element.dataset.active = active ? "true" : "false";
  element.setAttribute("aria-pressed", String(active));
}

export function CebuCourtMap({
  venues,
  selectedId,
  userLocation,
  onSelect,
  children,
  compactPreview = false,
  mobileEdgeToEdge = false,
}: CebuCourtMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, { marker: MapLibreMarker; element: HTMLButtonElement }>());
  const locationMarkerRef = useRef<MapLibreMarker | null>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const previousSelectionRef = useRef(selectedId);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    const markers = markersRef.current;

    void import("maplibre-gl")
      .then((maplibre) => {
        if (disposed) return;
        const dark = document.documentElement.dataset.theme === "dark";
        const map = new maplibre.Map({
          container,
          style: mapStyle(dark),
          center: [123.91, 10.34],
          zoom: 10.5,
          minZoom: 8,
          maxZoom: 18,
          maxBounds: [
            [CEBU_TILE_BOUNDS.west, CEBU_TILE_BOUNDS.south],
            [CEBU_TILE_BOUNDS.east, CEBU_TILE_BOUNDS.north],
          ],
          attributionControl: false,
          cooperativeGestures: true,
        });
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.FullscreenControl(), "top-right");
        map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");
        map.once("load", () => {
          if (disposed) return;
          mapRef.current = map;
          fitVenues(map, venues, true);
          setReady(true);
        });
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(container);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map instance is mounted once; later venue changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;

    void import("maplibre-gl").then(({ Marker }) => {
      if (cancelled) return;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();

      for (const venue of venues) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "relay-map-marker";
        element.setAttribute("aria-label", `Select ${venue.name}`);
        element.title = venue.name;
        setMarkerState(element, venue.id === selectedRef.current);
        const dot = document.createElement("span");
        dot.setAttribute("aria-hidden", "true");
        element.append(dot);
        element.addEventListener("click", () => selectRef.current(venue.id));

        const marker = new Marker({ element, anchor: "center" })
          .setLngLat([venue.longitude, venue.latitude])
          .addTo(map);
        markersRef.current.set(venue.id, { marker, element });
      }
      fitVenues(map, venues);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, venues]);

  useEffect(() => {
    for (const [id, { element }] of markersRef.current) setMarkerState(element, id === selectedId);
    const map = mapRef.current;
    if (!ready || !map) return;
    const previousSelection = previousSelectionRef.current;
    previousSelectionRef.current = selectedId;
    if (!selectedId || previousSelection === selectedId) return;
    const venue = venues.find((item) => item.id === selectedId);
    if (!venue) return;
    map.easeTo({
      center: [venue.longitude, venue.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : 450,
    });
  }, [ready, selectedId, venues]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    locationMarkerRef.current?.remove();
    locationMarkerRef.current = null;
    if (!userLocation) return;
    let cancelled = false;
    void import("maplibre-gl").then(({ Marker }) => {
      if (cancelled) return;
      const marker = document.createElement("span");
      marker.className = "relay-user-location-marker";
      marker.setAttribute("aria-label", "Your approximate location");
      locationMarkerRef.current = new Marker({ element: marker, anchor: "center" })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
      map.easeTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: Math.max(map.getZoom(), 12),
        duration: window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : 450,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, userLocation]);

  return (
    <div
      className={`relative w-full overflow-hidden border border-line bg-surface-raised sm:rounded-xl xl:h-full xl:min-h-0 ${mobileEdgeToEdge ? "border-x-0 sm:border-x" : "rounded-xl"} ${compactPreview ? "h-[360px] min-h-[360px] sm:h-[420px] sm:min-h-[420px]" : "h-[58dvh] min-h-[400px] max-h-[520px] sm:h-[min(68dvh,620px)] sm:min-h-[460px] sm:max-h-none"}`}
    >
      <div
        ref={containerRef}
        role="region"
        aria-label="Interactive map of pickleball courts"
        className="relay-interactive-map"
      />
      {!ready && !failed ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-raised" role="status">
          <div className="text-center">
            <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none" />
            <p className="mt-3 text-sm font-medium text-muted">Loading interactive map…</p>
          </div>
        </div>
      ) : null}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-raised px-6 text-center" role="status">
          <div>
            <p className="font-[650] text-ink">Map unavailable</p>
            <p className="mt-1 text-sm leading-5 text-muted">Use the court list below while the map reconnects.</p>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
