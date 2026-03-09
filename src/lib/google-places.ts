// ============================================================
// Google Places API (New) — Wrapper
// Uses the Places API v1 (New) endpoints
// Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
// ============================================================

import type { PlaceBusiness } from "@/types";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE_URL = "https://places.googleapis.com/v1/places";

interface PlacesTextSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  location?: { latitude: number; longitude: number };
  businessStatus?: string;
}

/**
 * Search businesses using Google Places Text Search (New)
 * Returns up to 20 results per call
 */
export async function searchBusinesses(
  city: string,
  category: string
): Promise<PlaceBusiness[]> {
  if (!API_KEY || API_KEY === "your_google_places_api_key_here") {
    throw new Error(
      "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to .env.local"
    );
  }

  const query = `${category} in ${city}`;

  const response = await fetch(`${BASE_URL}:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.types",
        "places.location",
        "places.businessStatus",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      maxResultCount: 20,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Places API error:", error);
    throw new Error(`Google Places API error: ${response.status} — ${error}`);
  }

  const data: PlacesTextSearchResponse = await response.json();

  if (!data.places || data.places.length === 0) {
    return [];
  }

  return data.places
    .filter((place) => place.businessStatus !== "CLOSED_PERMANENTLY")
    .map((place) => ({
      placeId: place.id,
      name: place.displayName?.text ?? "Unknown Business",
      address: place.formattedAddress ?? "No address",
      phone:
        place.nationalPhoneNumber ??
        place.internationalPhoneNumber ??
        null,
      website: place.websiteUri ?? null,
      rating: place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
      types: place.types ?? [],
      location: place.location
        ? { lat: place.location.latitude, lng: place.location.longitude }
        : null,
    }));
}
