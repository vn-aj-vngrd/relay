export const PHILIPPINES_TILE_BOUNDS = {
  west: 116.8,
  south: 4.45,
  east: 126.7,
  north: 21.35,
} as const;

function tileLongitude(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileLatitude(y: number, zoom: number) {
  return (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** zoom))) * 180) / Math.PI;
}

export function isValidPhilippinesTile(zoom: number, x: number, y: number) {
  if (!Number.isInteger(zoom) || !Number.isInteger(x) || !Number.isInteger(y) || zoom < 5 || zoom > 18) return false;
  const tileCount = 2 ** zoom;
  if (x < 0 || y < 0 || x >= tileCount || y >= tileCount) return false;

  const west = tileLongitude(x, zoom);
  const east = tileLongitude(x + 1, zoom);
  const north = tileLatitude(y, zoom);
  const south = tileLatitude(y + 1, zoom);

  return !(
    east < PHILIPPINES_TILE_BOUNDS.west ||
    west > PHILIPPINES_TILE_BOUNDS.east ||
    north < PHILIPPINES_TILE_BOUNDS.south ||
    south > PHILIPPINES_TILE_BOUNDS.north
  );
}
