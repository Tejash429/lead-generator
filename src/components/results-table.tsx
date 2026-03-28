"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Phone,
  MapPin,
  Star,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Save,
  Check,
  Loader2,
  BookmarkCheck,
  Clock,
  MessageSquare,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AnalyzedBusiness } from "@/types";
import { getScoreLabel } from "@/lib/lead-scoring";
import { EmailGenerator } from "@/components/email-generator";
import { AIPitchModal } from "@/components/ai-pitch-modal";
import { toast } from "sonner";

export type ResultsSortOption =
  | "best_score"
  | "worst_score"
  | "most_reviews"
  | "highest_rated"
  | "no_website_first";

function sortBusinesses(
  list: AnalyzedBusiness[],
  sortBy: ResultsSortOption
): AnalyzedBusiness[] {
  const arr = [...list];
  const reviews = (b: AnalyzedBusiness) => b.ratingCount ?? 0;

  switch (sortBy) {
    case "best_score":
      arr.sort((a, b) => b.leadScore - a.leadScore);
      break;
    case "worst_score":
      arr.sort((a, b) => a.leadScore - b.leadScore);
      break;
    case "most_reviews":
      arr.sort((a, b) => reviews(b) - reviews(a));
      break;
    case "highest_rated": {
      const ratingVal = (b: AnalyzedBusiness) => b.rating ?? -1;
      arr.sort((a, b) => {
        const diff = ratingVal(b) - ratingVal(a);
        if (diff !== 0) return diff;
        return reviews(b) - reviews(a);
      });
      break;
    }
    case "no_website_first":
      arr.sort((a, b) => {
        const wa = !!a.website;
        const wb = !!b.website;
        if (wa !== wb) return wa ? 1 : -1;
        return b.leadScore - a.leadScore;
      });
      break;
    default:
      break;
  }
  return arr;
}

interface ResultsTableProps {
  businesses: AnalyzedBusiness[];
  city: string;
  category: string;
  resultsKey: string;
  onSaveComplete: () => void;
}

function WebsiteStatusBadge({ business }: { business: AnalyzedBusiness }) {
  if (!business.website) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle className="size-3" />
        No Website
      </span>
    );
  }

  const status = business.websiteAnalysis?.status;

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle className="size-3" />
        Broken
      </span>
    );
  }

  if (status === "slow") {
    const loadTime = business.websiteAnalysis?.loadTimeMs;
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <AlertTriangle className="size-3" />
        Slow{loadTime ? ` ${(loadTime / 1000).toFixed(1)}s` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle className="size-3" />
      OK
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const label = getScoreLabel(score);
  const styles = {
    Hot: "bg-red-100 text-red-700",
    Warm: "bg-amber-100 text-amber-700",
    Cold: "bg-gray-100 text-gray-600",
  }[label];

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-full ${styles}`}>
      {score} · {label}
    </span>
  );
}

export function ResultsTable({
  businesses,
  city,
  category,
  resultsKey,
  onSaveComplete,
}: ResultsTableProps) {
  const [sortBy, setSortBy] = useState<ResultsSortOption>("best_score");
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        businesses
          .filter((b) => b.isLead && !b.alreadySaved)
          .map((b) => b.placeId)
      )
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setSortBy("best_score");
    setExpandedId(null);
    setSelected(
      new Set(
        businesses
          .filter((b) => b.isLead && !b.alreadySaved)
          .map((b) => b.placeId)
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when parent search identity (resultsKey) changes only
  }, [resultsKey]);

  const sortedBusinesses = useMemo(
    () => sortBusinesses(businesses, sortBy),
    [businesses, sortBy]
  );

  const categoryLabel =
    category === "top_businesses"
      ? "Top businesses"
      : category.replace(/_/g, " ");

  const toggleSelect = (placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) return;

    setSaving(true);
    try {
      const leadsToSave = businesses
        .filter((b) => selected.has(b.placeId))
        .map((b) => ({
          placeId: b.placeId,
          businessName: b.name,
          address: b.address,
          phone: b.phone,
          website: b.website,
          rating: b.rating,
          ratingCount: b.ratingCount,
          category,
          city,
          hasWebsite: !!b.website,
          websiteSpeed: b.websiteAnalysis?.loadTimeMs ?? null,
          websiteStatus: b.websiteAnalysis?.status ?? "missing",
          leadScore: b.leadScore,
        }));

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsToSave }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        onSaveComplete();
        toast.success(data.message || `Saved ${leadsToSave.length} leads`);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error("Failed to save leads");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Network error — failed to save leads");
    } finally {
      setSaving(false);
    }
  };

  if (businesses.length === 0) return null;

  const leads = businesses.filter((b) => b.isLead);
  const expandedBiz = expandedId
    ? sortedBusinesses.find((b) => b.placeId === expandedId) ?? null
    : null;

  const ROW_SIZE = 3;
  const rows: AnalyzedBusiness[][] = [];
  for (let i = 0; i < sortedBusinesses.length; i += ROW_SIZE) {
    rows.push(sortedBusinesses.slice(i, i + ROW_SIZE));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-gray-900">
            {businesses.length} businesses found
          </h3>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">{leads.length} potential leads</span>
            {" — "}no website or poor web presence
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={selected.size === 0 || saving}
          className="shrink-0 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {saved ? "Saved!" : `Save ${selected.size} selected`}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-sm text-gray-500 shrink-0">Sort by:</span>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy((v as ResultsSortOption) ?? "best_score")}
        >
          <SelectTrigger className="w-full sm:w-[240px] h-10 text-sm bg-white border-gray-200">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="best_score">Best Score First</SelectItem>
            <SelectItem value="worst_score">Worst Score First</SelectItem>
            <SelectItem value="most_reviews">Most Reviews</SelectItem>
            <SelectItem value="highest_rated">Highest Rated</SelectItem>
            <SelectItem value="no_website_first">No Website First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card grid — grouped by row so the detail panel sits between rows */}
      <div className="space-y-4">
        {rows.map((row, rowIdx) => {
          const rowHasExpanded = row.some((b) => b.placeId === expandedId);

          return (
            <React.Fragment key={rowIdx}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {row.map((biz) => {
                  const isExpanded = expandedId === biz.placeId;
                  const isSelected = selected.has(biz.placeId);

                  return (
                    <div
                      key={biz.placeId}
                      className={`rounded-xl border bg-white transition-all hover:shadow-md ${
                        isSelected ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-200"
                      } ${isExpanded ? "ring-2 ring-indigo-300 border-indigo-300" : ""} ${biz.isLead ? "" : "opacity-60"}`}
                    >
                      <div className="p-4 pb-3">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(biz.placeId)}
                            className="size-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-gray-900 truncate" title={biz.name}>
                                {biz.name}
                              </h4>
                              {biz.alreadySaved && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                                  <BookmarkCheck className="size-2.5" />
                                  Saved
                                </span>
                              )}
                            </div>
                          </div>
                          <ScoreBadge score={biz.leadScore} />
                        </div>

                        <div className="ml-[26px] mt-1">
                          <span className="text-[11px] text-gray-400 font-medium capitalize">
                            {categoryLabel}
                          </span>
                        </div>

                        <div className="mt-2.5 ml-[26px] space-y-1">
                          {biz.rating != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              <span className="font-medium text-gray-900 tabular-nums">{biz.rating}</span>
                              {biz.ratingCount != null && (
                                <span className="text-gray-400 text-xs">({biz.ratingCount} reviews)</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="size-3 shrink-0 text-gray-400" />
                            <span className="truncate">{biz.address}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 ml-[26px] flex flex-wrap gap-1.5">
                          <WebsiteStatusBadge business={biz} />
                        </div>
                      </div>

                      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5">
                          {biz.phone && (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <a
                                    href={`tel:${biz.phone}`}
                                    className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                  />
                                }
                              >
                                <Phone className="size-3.5" />
                                <span>Call</span>
                              </TooltipTrigger>
                              <TooltipContent>{biz.phone}</TooltipContent>
                            </Tooltip>
                          )}
                          {biz.website && (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <a
                                    href={biz.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                  />
                                }
                              >
                                <ExternalLink className="size-3.5" />
                                <span>Site</span>
                              </TooltipTrigger>
                              <TooltipContent>Visit website</TooltipContent>
                            </Tooltip>
                          )}
                          {biz.isLead && (
                            <EmailGenerator
                              businessName={biz.name}
                              category={category}
                              city={city}
                              hasWebsite={!!biz.website}
                              websiteStatus={biz.websiteAnalysis?.status ?? null}
                            />
                          )}
                          {!biz.website && (
                            <AIPitchModal
                              businessName={biz.name}
                              category={category}
                              city={city}
                              reviewCount={biz.ratingCount}
                              rating={biz.rating}
                            />
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : biz.placeId)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Details
                          <ChevronDown className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail panel — full-width below the row */}
              {rowHasExpanded && expandedBiz && (
                <div className="rounded-xl border border-indigo-200 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{expandedBiz.name}</h4>
                      <ScoreBadge score={expandedBiz.leadScore} />
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium shrink-0"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 text-sm">
                    {/* Column 1 — Details */}
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Details</h5>
                      <p className="flex items-start gap-1.5 text-gray-600">
                        <MapPin className="size-3.5 mt-0.5 shrink-0 text-gray-400" />
                        {expandedBiz.address}
                      </p>
                      {expandedBiz.rating != null && (
                        <p className="flex items-center gap-1.5 text-gray-600">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {expandedBiz.rating} stars
                          {expandedBiz.ratingCount != null && ` (${expandedBiz.ratingCount} reviews)`}
                        </p>
                      )}
                      {expandedBiz.websiteAnalysis?.loadTimeMs != null && (
                        <p className="text-xs text-gray-500">
                          Website load time: {expandedBiz.websiteAnalysis.loadTimeMs}ms
                        </p>
                      )}
                    </div>

                    {/* Column 2 — Hours */}
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="size-3" />
                        Hours
                      </h5>
                      {expandedBiz.openingHours ? (
                        <ul className="space-y-0.5 text-xs text-gray-500">
                          {expandedBiz.openingHours.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400">Not available</p>
                      )}
                    </div>

                    {/* Column 3 — Recent review */}
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        Recent Review
                      </h5>
                      {expandedBiz.recentReview ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-3 ${
                                  i < expandedBiz.recentReview!.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                            {expandedBiz.recentReview.time && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                {expandedBiz.recentReview.time}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
                            &ldquo;{expandedBiz.recentReview.text}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No reviews available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
