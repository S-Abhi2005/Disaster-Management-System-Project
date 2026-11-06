const cache = new Map();

const keyFor = (lat, lng) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;

export const reverseGeocode = async (lat, lng) => {
  if (lat == null || lng == null) return null;

  const key = keyFor(lat, lng);
  if (cache.has(key)) return cache.get(key);

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) return null;
  const data = await res.json();

  const address = data?.address || {};
  const city = address.city || address.town || address.village || address.county || '';
  const state = address.state || '';
  const displayName = data?.display_name || '';

  const result = {
    displayName,
    city,
    state,
  };

  cache.set(key, result);
  return result;
};
