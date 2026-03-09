// ============================================================
// POST /api/search
// Search businesses via Google Places + analyze websites
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { searchBusinesses } from "@/lib/google-places";
import { analyzeWebsite } from "@/lib/website-analyzer";
import { calculateLeadScoreWithCategory } from "@/lib/lead-scoring";
import { searchSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import type { AnalyzedBusiness, SearchResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 searches per minute (Google Places API costs money)
    const key = getRateLimitKey(request, "search");
    const { limited } = rateLimit(key, 5, 5 / 60);
    if (limited) {
      return NextResponse.json(
        { error: "Too many searches. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { city, category } = parsed.data;

    // 1. Search Google Places
    const businesses = await searchBusinesses(city, category);

    if (businesses.length === 0) {
      return NextResponse.json({
        businesses: [],
        totalFound: 0,
        leadsFound: 0,
        searchedAt: new Date().toISOString(),
      } satisfies SearchResponse);
    }

    // 2. Analyze websites (in parallel with concurrency limit)
    const CONCURRENCY = 5;
    const analyzedBusinesses: AnalyzedBusiness[] = [];

    for (let i = 0; i < businesses.length; i += CONCURRENCY) {
      const batch = businesses.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (biz) => {
          let websiteAnalysis = null;

          if (biz.website) {
            try {
              websiteAnalysis = await analyzeWebsite(biz.website);
            } catch {
              websiteAnalysis = {
                url: biz.website,
                status: "error" as const,
                loadTimeMs: null,
                statusCode: null,
                isOutdated: false,
                reason: "Failed to analyze",
              };
            }
          }

          const isLead =
            !biz.website ||
            websiteAnalysis?.status === "missing" ||
            websiteAnalysis?.status === "slow" ||
            websiteAnalysis?.status === "error";

          return {
            ...biz,
            websiteAnalysis: biz.website
              ? websiteAnalysis
              : {
                  url: "",
                  status: "missing" as const,
                  loadTimeMs: null,
                  statusCode: null,
                  isOutdated: false,
                  reason: "No website listed",
                },
            isLead,
            alreadySaved: false,
            leadScore: 0, // will be calculated after
          } satisfies AnalyzedBusiness;
        })
      );

      analyzedBusinesses.push(...batchResults);
    }

    // Calculate lead scores
    for (const biz of analyzedBusinesses) {
      biz.leadScore = calculateLeadScoreWithCategory(biz, category);
    }

    // Sort: leads first, then by score descending, then by rating
    analyzedBusinesses.sort((a, b) => {
      if (a.isLead && !b.isLead) return -1;
      if (!a.isLead && b.isLead) return 1;
      // Within same lead status, sort by score descending
      if (a.leadScore !== b.leadScore) return b.leadScore - a.leadScore;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    const leadsFound = analyzedBusinesses.filter((b) => b.isLead).length;

    // 3. Check which businesses are already saved in DB
    try {
      const placeIds = analyzedBusinesses.map((b) => b.placeId);
      const existing = await prisma.lead.findMany({
        where: { placeId: { in: placeIds } },
        select: { placeId: true },
      });
      const savedSet = new Set(existing.map((e) => e.placeId));
      for (const biz of analyzedBusinesses) {
        biz.alreadySaved = savedSet.has(biz.placeId);
      }
    } catch {
      // Non-critical — mark all as not saved if DB is unavailable
      for (const biz of analyzedBusinesses) {
        biz.alreadySaved = false;
      }
    }

    // 4. Save search to history
    try {
      await prisma.searchHistory.create({
        data: {
          city,
          category,
          results: analyzedBusinesses.length,
          leads: leadsFound,
        },
      });
    } catch {
      // Non-critical — don't fail the request if DB is not set up
      console.warn("Could not save search history (database may not be configured)");
    }

    const response: SearchResponse = {
      businesses: analyzedBusinesses,
      totalFound: analyzedBusinesses.length,
      leadsFound,
      searchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "An error occurred while searching. Please try again.",
      },
      { status: 500 }
    );
  }
}
