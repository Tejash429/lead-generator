"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SearchForm } from "@/components/search-form";
import { ResultsTable } from "@/components/results-table";
import { StatsCards } from "@/components/stats-cards";
import { RecentSearches } from "@/components/recent-searches";
import type { AnalyzedBusiness, SearchResponse } from "@/types";
import { Radar, Search, BarChart3, Mail, Loader2, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TOP_CATEGORIES = [
  "restaurant",
  "gym",
  "dentist",
  "salon",
  "clinic",
  "hotel",
  "cafe",
  "pharmacy",
  "school",
  "shop",
] as const;

function compositeForRanking(b: AnalyzedBusiness, maxReviews: number): number {
  const rc = b.ratingCount ?? 0;
  const normRev = maxReviews > 0 ? rc / maxReviews : 0;
  const normRat = (b.rating ?? 0) / 5;
  return 0.6 * normRev + 0.4 * normRat;
}

function buildTopBusinessesResponse(merged: AnalyzedBusiness[]): SearchResponse {
  const maxReviews = Math.max(0, ...merged.map((b) => b.ratingCount ?? 0));
  const byId = new Map<string, AnalyzedBusiness>();
  for (const b of merged) {
    const existing = byId.get(b.placeId);
    if (!existing) {
      byId.set(b.placeId, b);
      continue;
    }
    if (compositeForRanking(b, maxReviews) > compositeForRanking(existing, maxReviews)) {
      byId.set(b.placeId, b);
    }
  }
  const unique = [...byId.values()];
  unique.sort(
    (a, b) => compositeForRanking(b, maxReviews) - compositeForRanking(a, maxReviews)
  );
  const top30 = unique.slice(0, 30);
  return {
    businesses: top30,
    totalFound: top30.length,
    leadsFound: top30.filter((x) => x.isLead).length,
    searchedAt: new Date().toISOString(),
  };
}

async function fetchTopBusinessesMulti(city: string): Promise<{
  response: SearchResponse;
  failedCategories: number;
}> {
  const settled = await Promise.allSettled(
    TOP_CATEGORIES.map((category) =>
      fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, category }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed: ${category}`);
        return data as SearchResponse;
      })
    )
  );

  const merged: AnalyzedBusiness[] = [];
  let failedCategories = 0;
  for (const s of settled) {
    if (s.status === "rejected") {
      failedCategories++;
      continue;
    }
    merged.push(...s.value.businesses);
  }

  if (merged.length === 0 && failedCategories === TOP_CATEGORIES.length) {
    throw new Error(
      "Could not load results. You may be rate-limited — wait a minute and try again."
    );
  }

  const response = buildTopBusinessesResponse(merged);
  return { response, failedCategories };
}

type DashboardTab = "find" | "top";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DashboardTab>("find");

  const [findResults, setFindResults] = useState<SearchResponse | null>(null);
  const [findCity, setFindCity] = useState("");
  const [findCategory, setFindCategory] = useState("");
  const [findError, setFindError] = useState<string | null>(null);

  const [topResults, setTopResults] = useState<SearchResponse | null>(null);
  const [topCity, setTopCity] = useState("");
  const [topCityInput, setTopCityInput] = useState("");
  const [topError, setTopError] = useState<string | null>(null);
  const [topLoading, setTopLoading] = useState(false);

  const handleFindResults = (
    data: SearchResponse,
    city: string,
    category: string
  ) => {
    setFindResults(data);
    setFindCity(city);
    setFindCategory(category);
    setFindError(null);
    queryClient.invalidateQueries({ queryKey: ["search-history"] });
  };

  const handleFindError = (message: string) => {
    setFindError(message);
  };

  const handleSaveComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
  };

  const handleTopSearch = async () => {
    const city = topCityInput.trim();
    if (city.length < 2) {
      setTopError("Please enter a city or area (at least 2 characters)");
      return;
    }

    setTopLoading(true);
    setTopError(null);
    try {
      const { response, failedCategories } = await fetchTopBusinessesMulti(city);
      setTopResults(response);
      setTopCity(city);
      queryClient.invalidateQueries({ queryKey: ["search-history"] });

      if (failedCategories > 0 && response.businesses.length > 0) {
        toast.warning(
          `${failedCategories} of ${TOP_CATEGORIES.length} category scans failed — showing partial results`
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setTopError(msg);
      toast.error(msg);
    } finally {
      setTopLoading(false);
    }
  };

  const results = activeTab === "find" ? findResults : topResults;
  const searchCity = activeTab === "find" ? findCity : topCity;
  const searchCategory = activeTab === "find" ? findCategory : "top_businesses";
  const error = activeTab === "find" ? findError : topError;

  const resultsKey =
    activeTab === "find" && findResults
      ? `${findCity}|${findCategory}|${findResults.searchedAt}`
      : activeTab === "top" && topResults
        ? `${topCity}|top|${topResults.searchedAt}`
        : "";

  const totalSearched = results?.totalFound ?? 0;
  const leadsFound = results?.leadsFound ?? 0;
  const noWebsite = results?.businesses.filter((b) => !b.website).length ?? 0;
  const slowWebsite =
    results?.businesses.filter(
      (b) =>
        b.website &&
        (b.websiteAnalysis?.status === "slow" ||
          b.websiteAnalysis?.status === "error")
    ).length ?? 0;

  const STEPS = [
    {
      icon: Search,
      title: "Search",
      description: "Enter a city and business category to scan Google Places",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: BarChart3,
      title: "Analyze",
      description: "We check each business for website presence and quality",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: Mail,
      title: "Pitch",
      description: "Generate AI-powered cold emails and start outreach",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  const showFindEmptyState = activeTab === "find" && !findResults;
  const showTopEmptyState = activeTab === "top" && !topResults;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          Find Your Next Client
        </h1>
        <p className="mt-2 text-gray-500 text-base max-w-xl">
          Search local businesses without websites, score them as leads, and send personalized pitch emails — all in one place.
        </p>
      </section>

      {/* Tabs + search */}
      <section className="space-y-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("find")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === "find"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <span aria-hidden>🔍</span>
            Find Leads
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === "top"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <span aria-hidden>🏆</span>
            Top Businesses
          </button>
        </div>

        {activeTab === "find" && (
          <SearchForm onResults={handleFindResults} onError={handleFindError} />
        )}

        {activeTab === "top" && (
          <div className="w-full">
            <div className="rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="City/Area (e.g. Satellite, Ahmedabad)"
                    value={topCityInput}
                    onChange={(e) => setTopCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTopSearch()}
                    className="pl-10 h-11 border-0 shadow-none focus-visible:ring-0 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400"
                    disabled={topLoading}
                  />
                </div>
                <Button
                  onClick={handleTopSearch}
                  disabled={topLoading}
                  className="h-11 px-6 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  size="lg"
                >
                  {topLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Trophy className="size-4" />
                      Show Top Businesses
                    </>
                  )}
                </Button>
              </div>
            </div>
            {topLoading && (
              <p className="mt-3 text-sm text-gray-500 px-1">
                Running {TOP_CATEGORIES.length} category scans in parallel — this can take a minute.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
      </section>

      {showFindEmptyState && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-xl border border-gray-200 bg-white p-6 group hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center ${step.color}`}
                  >
                    <step.icon className="size-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </section>

          <RecentSearches />
        </>
      )}

      {showTopEmptyState && (
        <section className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Enter a city or area and run <span className="font-semibold text-gray-800">Show Top Businesses</span>{" "}
            to merge popular categories, dedupe by place, and surface the top 30 by reviews and rating.
          </p>
        </section>
      )}

      {results && (
        <StatsCards
          totalSearched={totalSearched}
          leadsFound={leadsFound}
          noWebsite={noWebsite}
          slowWebsite={slowWebsite}
        />
      )}

      {results && results.businesses.length > 0 && (
        <ResultsTable
          businesses={results.businesses}
          city={searchCity}
          category={searchCategory}
          resultsKey={resultsKey}
          onSaveComplete={handleSaveComplete}
        />
      )}

      {results && results.businesses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Radar className="size-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900">No businesses found</p>
          <p className="text-sm text-gray-500 mt-1 max-w-[300px]">
            {activeTab === "find"
              ? "Try a different city or business category"
              : "Try a different city or area"}
          </p>
        </div>
      )}
    </div>
  );
}
