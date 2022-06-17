import signature from '@googlemaps/url-signature';
import fetch from 'node-fetch';

const baseUrl = 'https://maps.googleapis.com/maps/api/streetview/metadata';

function stringifyLocation(location) {
  if (typeof location === 'object') {
    return [location.lat, location.lng].join(',');
  }
  return location;
}

export async function fetchClosestStreetView(location, radius = 50) {
  const searchParams = new URLSearchParams();
  searchParams.append('location', stringifyLocation(location));
  searchParams.append('radius', radius);
  searchParams.append('key', process.env.GCLOUD_API_KEY);

  const url = signature.signUrl(`${baseUrl}?${searchParams.toString()}`, process.env.GCLOUD_SECRET);

  try {
    const response = await fetch(url.href);
    const result = await response.json();
    if (result.status === 'OK' && result.location) {
      return result.location;
    }
    return null;
  } catch (err) {
    return null;
  }
}
