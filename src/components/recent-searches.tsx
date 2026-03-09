"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Target } from "lucide-react";

interface SearchEntry {
  id: string;
  city: string;
  category: string;
  results: number;
  leads: number;
  searchedAt: string;
}

export function RecentSearches() {
  const [searches, setSearches] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/search/history");
        if (res.ok) {
          const data = await res.json();
          setSearches(data.searches);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading || searches.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent Searches
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {searches.map((s) => (
          <div
            key={s.id}
            className="group rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate capitalize leading-tight">
                  {s.category.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{s.city}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Target className="size-2.5" />
                  {s.leads}/{s.results}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-2">
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
