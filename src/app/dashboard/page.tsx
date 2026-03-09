"use client";

import { useState } from "react";
import { SearchForm } from "@/components/search-form";
import { ResultsTable } from "@/components/results-table";
import { StatsCards } from "@/components/stats-cards";
import { RecentSearches } from "@/components/recent-searches";
import type { SearchResponse } from "@/types";
import { Radar, Crosshair, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleResults = (
    data: SearchResponse,
    city: string,
    category: string
  ) => {
    setResults(data);
    setSearchCity(city);
    setSearchCategory(category);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const handleSaveComplete = () => {
    setRefreshKey((k) => k + 1);
  };

  const totalSearched = results?.totalFound ?? 0;
  const leadsFound = results?.leadsFound ?? 0;
  const noWebsite =
    results?.businesses.filter((b) => !b.website).length ?? 0;
  const slowWebsite =
    results?.businesses.filter(
      (b) =>
        b.website &&
        (b.websiteAnalysis?.status === "slow" ||
          b.websiteAnalysis?.status === "error")
    ).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero Search Section */}
      <section className="relative">
        <div className="space-y-5">
          {/* Page title */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded flex items-center justify-center bg-primary/10">
                  <Crosshair className="size-3 text-primary" />
                </div>
                <h2 className="text-[13px] font-semibold text-primary tracking-wide uppercase">
                  Lead Finder
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Search businesses by city and category to discover opportunities
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 hidden sm:flex"
              nativeButton={false}
              render={<Link href="/dashboard/leads" />}
            >
              View Saved Leads
              <ArrowRight className="size-3" />
            </Button>
          </div>

          {/* Search */}
          <SearchForm onResults={handleResults} onError={handleError} />

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm">
              <div className="size-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Recent Searches (when no results) */}
      {!results && <RecentSearches key={refreshKey} />}

      {/* Stats */}
      {results && (
        <StatsCards
          totalSearched={totalSearched}
          leadsFound={leadsFound}
          noWebsite={noWebsite}
          slowWebsite={slowWebsite}
        />
      )}

      {/* Results */}
      {results && results.businesses.length > 0 && (
        <ResultsTable
          businesses={results.businesses}
          city={searchCity}
          category={searchCategory}
          onSaveComplete={handleSaveComplete}
        />
      )}

      {/* Empty result */}
      {results && results.businesses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Radar className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">
            No businesses found
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
            Try a different city or business category
          </p>
        </div>
      )}
    </div>
  );
}
