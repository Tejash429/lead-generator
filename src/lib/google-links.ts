/**
 * Google Search / Maps / Reviews URLs for a business.
 * Maps uses place_id when available for accuracy.
 */

function searchSuffix(businessName: string, city: string): string {
  const name = businessName.trim();
  const c = city.trim();
  if (!c) return name;
  return `${name} ${c}`;
}

export function googleSearchUrl(businessName: string, city: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(searchSuffix(businessName, city))}`;
}

export function googleMapsUrl(
  businessName: string,
  city: string,
  placeId: string | null | undefined
): string {
  const id = placeId?.trim();
  if (id) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(id)}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(searchSuffix(businessName, city))}`;
}

export function googleReviewsUrl(businessName: string, city: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${searchSuffix(businessName, city)} reviews`)}`;
}
