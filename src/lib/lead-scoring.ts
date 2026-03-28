// ============================================================
// Lead Scoring Engine
// Calculates a score to prioritize outreach
// ============================================================

import type { AnalyzedBusiness } from "@/types";

/**
 * Score a lead based on website presence, review volume, and rating.
 *
 * Points:
 * - No website:       +50
 * - 50+ reviews:      +20
 * - 200+ reviews:     +10 bonus (stacks with 50+)
 * - Rating 4.0+:      +10
 * - Rating 4.5+:      +10 bonus (stacks with 4.0+)
 *
 * Labels: Hot (70+), Warm (40–69), Cold (<40)
 */
export function scoreLead(business: AnalyzedBusiness): {
  score: number;
  label: "Hot" | "Warm" | "Cold";
} {
  let score = 0;

  if (!business.website) score += 50;

  const reviews = business.ratingCount ?? 0;
  if (reviews >= 50) score += 20;
  if (reviews >= 200) score += 10;

  const rating = business.rating ?? 0;
  if (rating >= 4.0) score += 10;
  if (rating >= 4.5) score += 10;

  const label: "Hot" | "Warm" | "Cold" =
    score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";

  return { score, label };
}

export function getScoreColor(score: number): {
  text: string;
  bg: string;
} {
  if (score >= 70) {
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    };
  }
  if (score >= 40) {
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

export function getScoreLabel(score: number): string {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
}
