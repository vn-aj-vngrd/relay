const EARTH_RADIUS_KM = 6371;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInKilometers(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const originLatitude = radians(origin.latitude);
  const destinationLatitude = radians(destination.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function formatDistance(kilometers: number) {
  if (kilometers < 1)
    return `${Math.max(0.1, Math.round(kilometers * 10) / 10)} km`;
  return `${Math.round(kilometers * 10) / 10} km`;
}
