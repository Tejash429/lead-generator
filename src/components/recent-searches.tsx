"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchEntry {
  id: string;
  city: string;
  category: string;
  results: number;
  leads: number;
  searchedAt: string;
}

async function fetchSearchHistory(): Promise<SearchEntry[]> {
  const res = await fetch("/api/search/history");
  if (!res.ok) return [];
  const data = await res.json();
  return data.searches ?? [];
}

function RecentSearchesSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="size-3.5 rounded" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentSearches() {
  const { data: searches = [], isLoading } = useQuery({
    queryKey: ["search-history"],
    queryFn: fetchSearchHistory,
  });

  if (isLoading) return <RecentSearchesSkeleton />;
  if (searches.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Recent Searches
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {searches.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate capitalize leading-tight">
                  {s.category.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="size-3 shrink-0 text-gray-400" />
                  <span className="truncate">{s.city}</span>
                </p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <Target className="size-2.5" />
                {s.leads}/{s.results}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              {new Date(s.searchedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
