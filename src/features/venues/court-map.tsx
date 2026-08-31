"use client";

import type {
  FullscreenControl as MapLibreFullscreenControl,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  StyleSpecification,
} from "maplibre-gl";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { courtDirectoryCoverage } from "./coverage";
import type { CourtListing } from "./directory";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MAP_STYLESHEET_ID = "relay-maplibre-styles";

function ensureMapStylesheet() {
  const existing = document.getElementById(MAP_STYLESHEET_ID) as HTMLLinkElement | null;
  if (existing?.sheet) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const link = existing ?? document.createElement("link");
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      link.remove();
      reject(new Error("Map styles failed to load"));
    };
    const cleanup = () => {
      link.removeEventListener("load", onLoad);
      link.removeEventListener("error", onError);
    };
    link.addEventListener("load", onLoad);
    link.addEventListener("error", onError);
    if (!existing) {
      link.id = MAP_STYLESHEET_ID;
      link.rel = "stylesheet";
      link.href = "/maplibre-gl.css";
      document.head.append(link);
    }
  });
}

type CourtMapProps = {
  venues: CourtListing[];
  selectedId: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect: (id: string) => void;
  children?: ReactNode;
  compactPreview?: boolean;
  mobileEdgeToEdge?: boolean;
  autoLoad?: boolean;
};

function mapStyle(dark: boolean): StyleSpecification {
  const style = dark ? "dark-matter" : "osm-bright-grey";
  const viewport = courtDirectoryCoverage.mapViewport();
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: [`/api/venues/tiles/{z}/{x}/{y}?style=${style}`],
        tileSize: 256,
        minzoom: viewport.minZoom,
        maxzoom: viewport.maxZoom,
        attribution:
          '<a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}

function fitVenues(map: MapLibreMap, venues: CourtListing[], immediate = false) {
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

export function collapseAttributionControl(container: HTMLElement) {
  const attribution = container.querySelector<HTMLDetailsElement>(".maplibregl-ctrl-attrib");
  if (!attribution) return;
  attribution.open = false;
  attribution.classList.remove("maplibregl-compact-show");
}

export function createMobileSafeFullscreenControl(
  FullscreenControl: new (options?: { pseudo?: boolean; container?: HTMLElement }) => MapLibreFullscreenControl,
  container: HTMLElement,
) {
  return new FullscreenControl({ pseudo: true, container });
}

export function CourtMap({
  venues,
  selectedId,
  userLocation,
  onSelect,
  children,
  compactPreview = false,
  mobileEdgeToEdge = false,
  autoLoad = false,
}: CourtMapProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, { marker: MapLibreMarker; element: HTMLButtonElement }>());
  const locationMarkerRef = useRef<MapLibreMarker | null>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const [activated, setActivated] = useState(autoLoad || !compactPreview);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!activated) return;
    const shell = shellRef.current;
    const container = containerRef.current;
    if (!shell || !container) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let removeThemeListener: (() => void) | null = null;
    const markers = markersRef.current;

    void ensureMapStylesheet()
      .then(() => import("maplibre-gl"))
      .then((maplibre) => {
        if (disposed) return;
        const dark = document.documentElement.dataset.theme === "dark";
        const viewport = courtDirectoryCoverage.mapViewport();
        const map = new maplibre.Map({
          container,
          style: mapStyle(dark),
          center: viewport.center,
          zoom: viewport.zoom,
          minZoom: viewport.minZoom,
          maxZoom: viewport.maxZoom,
          maxBounds: viewport.maxBounds,
          attributionControl: false,
          cooperativeGestures: true,
        });
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(createMobileSafeFullscreenControl(maplibre.FullscreenControl, shell), "top-right");
        map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");
        map.once("load", () => {
          if (disposed) return;
          mapRef.current = map;
          fitVenues(map, venues, true);
          collapseAttributionControl(container);
          setReady(true);
        });
        const updateTheme = () => map.setStyle(mapStyle(document.documentElement.dataset.theme === "dark"));
        window.addEventListener("relay-theme-change", updateTheme);
        removeThemeListener = () => window.removeEventListener("relay-theme-change", updateTheme);
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(container);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      removeThemeListener?.();
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map instance is mounted after intent; later venue changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activated]);

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
  }, [selectedId]);

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
      ref={shellRef}
      className={`relay-court-map-shell relative w-full overflow-hidden border border-line bg-surface-raised sm:rounded-xl xl:h-full xl:min-h-0 ${mobileEdgeToEdge ? "border-x-0 sm:border-x" : "rounded-xl"} ${compactPreview ? "h-[360px] min-h-[360px] sm:h-[420px] sm:min-h-[420px]" : "h-[58dvh] min-h-[400px] max-h-[520px] sm:h-[min(68dvh,620px)] sm:min-h-[460px] sm:max-h-none"}`}
    >
      <div
        ref={containerRef}
        role="region"
        aria-label="Interactive map of pickleball courts"
        className="relay-interactive-map"
      />
      {!activated ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-raised px-6 text-center">
          <div className="max-w-sm">
            <p className="font-[650] text-ink">Explore the Philippines court map</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              Load the interactive map when you want to pan, zoom, or inspect court locations.
            </p>
            <button
              type="button"
              onClick={() => setActivated(true)}
              className="pressable mt-4 min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Load interactive map
            </button>
          </div>
        </div>
      ) : !ready && !failed ? (
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
