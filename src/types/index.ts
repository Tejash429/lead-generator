// ============================================================
// Lead Generator — Shared Types
// ============================================================

/** Raw business result from Google Places API search */
export interface PlaceBusiness {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratingCount: number | null;
  types: string[];
  location: {
    lat: number;
    lng: number;
  } | null;
  openingHours: string[] | null;
  recentReview: {
    text: string;
    rating: number;
    time: string;
  } | null;
}

/** Website analysis result */
export interface WebsiteAnalysis {
  url: string;
  status: "missing" | "slow" | "error" | "ok";
  loadTimeMs: number | null;
  statusCode: number | null;
  isOutdated: boolean;
  reason: string;
}

/** Business with website analysis attached */
export interface AnalyzedBusiness extends PlaceBusiness {
  websiteAnalysis: WebsiteAnalysis | null;
  isLead: boolean; // true if no website or bad website
  alreadySaved: boolean; // true if already in the database
  leadScore: number; // 1-100 priority score
}

/** Lead saved to database */
export interface Lead {
  id: string;
  placeId: string;
  businessName: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratingCount: number | null;
  category: string;
  city: string;
  hasWebsite: boolean;
  websiteSpeed: number | null;
  websiteStatus: string | null;
  leadScore: number | null;
  isFavorite: boolean;
  status: LeadStatus;
  notes: string | null;
  lastContactedAt: string | null;
  savedAt: string;
  updatedAt: string;
}

export type LeadStatus = "new" | "contacted" | "responded" | "converted" | "skipped";

/** Search request payload */
export interface SearchRequest {
  city: string;
  category: string;
}

/** Search response from API */
export interface SearchResponse {
  businesses: AnalyzedBusiness[];
  totalFound: number;
  leadsFound: number;
  searchedAt: string;
}

/** Save leads request */
export interface SaveLeadsRequest {
  leads: {
    placeId: string;
    businessName: string;
    address: string;
    phone: string | null;
    website: string | null;
    rating: number | null;
    ratingCount: number | null;
    category: string;
    city: string;
    hasWebsite: boolean;
    websiteSpeed: number | null;
    websiteStatus: string | null;
  }[];
}

/** Business categories for the search form */
export const BUSINESS_CATEGORIES = [
  { value: "restaurant", label: "Restaurants" },
  { value: "gym", label: "Gyms & Fitness" },
  { value: "dentist", label: "Dentists" },
  { value: "salon", label: "Hair Salons" },
  { value: "spa", label: "Spas & Wellness" },
  { value: "plumber", label: "Plumbers" },
  { value: "electrician", label: "Electricians" },
  { value: "lawyer", label: "Lawyers" },
  { value: "accountant", label: "Accountants" },
  { value: "real_estate", label: "Real Estate Agents" },
  { value: "auto_repair", label: "Auto Repair Shops" },
  { value: "bakery", label: "Bakeries" },
  { value: "cafe", label: "Cafés & Coffee Shops" },
  { value: "veterinarian", label: "Veterinarians" },
  { value: "florist", label: "Florists" },
  { value: "photographer", label: "Photographers" },
  { value: "cleaning_service", label: "Cleaning Services" },
  { value: "landscaping", label: "Landscaping" },
  { value: "tutoring", label: "Tutoring & Education" },
  { value: "pet_grooming", label: "Pet Grooming" },
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]["value"];
