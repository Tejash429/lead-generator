// ============================================================
// Lead Scoring Engine
// Calculates a 1–100 score to prioritize outreach
// ============================================================

import type { AnalyzedBusiness } from "@/types";

/** Categories with higher revenue potential (businesses that pay more for websites) */
const HIGH_VALUE_CATEGORIES = new Set([
  "dentist",
  "lawyer",
  "real_estate",
  "accountant",
  "veterinarian",
  "spa",
]);

/**
 * Calculate a lead score from 1–100.
 *
 * Scoring breakdown:
 * - Base:             50 points
 * - Rating bonus:     up to +20 (higher rating = more established = more budget)
 * - Review count:     up to +15 (more reviews = more popular = more to gain from a site)
 * - Website status:   +15 (no website), +10 (slow/broken), +0 (ok)
 * - Category value:   +5 (high-value categories like dentists, lawyers)
 * - Has phone:        +2 (contactable)
 *
 * Final score is capped at 100.
 */
export function calculateLeadScore(business: AnalyzedBusiness): number {
  let score = 50;

  // Rating bonus: (rating / 5) * 20 → max +20
  if (business.rating) {
    score += Math.round((business.rating / 5) * 20);
  }

  // Review count bonus: min(count / 10, 15) → max +15
  if (business.ratingCount) {
    score += Math.min(Math.round(business.ratingCount / 10), 15);
  }

  // Website status bonus
  if (!business.website) {
    score += 15; // Best lead — no website at all
  } else if (
    business.websiteAnalysis?.status === "slow" ||
    business.websiteAnalysis?.status === "error"
  ) {
    score += 10; // Good lead — website exists but is bad
  }
  // OK website = +0

  // High-value category bonus
  const categoryLower = business.types?.[0]?.toLowerCase() ?? "";
  // Check against our known high-value list (using the search category is better)
  // We'll pass the search category separately if needed
  if (HIGH_VALUE_CATEGORIES.has(categoryLower)) {
    score += 5;
  }

  // Has phone number (can actually contact them)
  if (business.phone) {
    score += 2;
  }

  return Math.min(score, 100);
}

/**
 * Calculate score using the search category (more reliable than Place types)
 */
export function calculateLeadScoreWithCategory(
  business: AnalyzedBusiness,
  searchCategory: string
): number {
  let score = calculateLeadScore(business);

  // Override category check with the actual search category
  if (HIGH_VALUE_CATEGORIES.has(searchCategory)) {
    // Only add if not already added
    const categoryLower = business.types?.[0]?.toLowerCase() ?? "";
    if (!HIGH_VALUE_CATEGORIES.has(categoryLower)) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

/**
 * Get the display color for a score
 */
export function getScoreColor(score: number): {
  text: string;
  bg: string;
} {
  if (score >= 80) {
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    };
  }
  if (score >= 60) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    };
  }
  return {
    text: "text-muted-foreground",
    bg: "bg-muted",
  };
}

/**
 * Get a label for the score range
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  return "Cool";
}
