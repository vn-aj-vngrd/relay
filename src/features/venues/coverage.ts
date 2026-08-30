export type CourtCoordinate = { latitude: number; longitude: number };
export type CourtCoverageIssue = { path: "latitude" | "longitude"; message: string };
export type CourtMapTile = { zoom: number; x: number; y: number };
export type CourtMapViewport = {
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  maxBounds: [[number, number], [number, number]];
};

const bounds = {
  west: 116.8,
  south: 4.45,
  east: 126.7,
  north: 21.35,
} as const;

const initialCenter: [number, number] = [122.2, 12.1];
const initialZoom = 5.2;
const minimumZoom = 5;
const maximumZoom = 18;

function mapViewport(): CourtMapViewport {
  return {
    center: [...initialCenter],
    zoom: initialZoom,
    minZoom: minimumZoom,
    maxZoom: maximumZoom,
    maxBounds: [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north],
    ],
  };
}

function tileLongitude(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileLatitude(y: number, zoom: number) {
  return (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** zoom))) * 180) / Math.PI;
}

function contains({ latitude, longitude }: CourtCoordinate) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

function validatePublishingCoordinate(input: { latitude: number | ""; longitude: number | "" }) {
  const issues: CourtCoverageIssue[] = [];
  if (input.latitude === "")
    issues.push({ path: "latitude", message: "Add a Philippines latitude before publishing." });
  else if (!Number.isFinite(input.latitude) || input.latitude < bounds.south || input.latitude > bounds.north)
    issues.push({ path: "latitude", message: "Latitude must be inside the Philippines." });

  if (input.longitude === "")
    issues.push({ path: "longitude", message: "Add a Philippines longitude before publishing." });
  else if (!Number.isFinite(input.longitude) || input.longitude < bounds.west || input.longitude > bounds.east)
    issues.push({ path: "longitude", message: "Longitude must be inside the Philippines." });

  return issues;
}

function allowsTile({ zoom, x, y }: CourtMapTile) {
  if (!Number.isInteger(zoom) || !Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (zoom < minimumZoom || zoom > maximumZoom) return false;
  const tileCount = 2 ** zoom;
  if (x < 0 || y < 0 || x >= tileCount || y >= tileCount) return false;

  const west = tileLongitude(x, zoom);
  const east = tileLongitude(x + 1, zoom);
  const north = tileLatitude(y, zoom);
  const south = tileLatitude(y + 1, zoom);

  return !(east < bounds.west || west > bounds.east || north < bounds.south || south > bounds.north);
}

/** The single policy interface for Relay's Court directory coverage. */
export const courtDirectoryCoverage = {
  name: "Philippines",
  contains,
  validatePublishingCoordinate,
  allowsTile,
  mapViewport,
} as const;
