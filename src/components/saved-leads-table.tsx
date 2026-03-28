"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  MapPin,
  Star,
  Globe,
  ExternalLink,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  Inbox,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Filter,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead, LeadStatus } from "@/types";
import { BUSINESS_CATEGORIES as CATEGORIES } from "@/types";
import { getScoreLabel } from "@/lib/lead-scoring";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { EmailGenerator } from "@/components/email-generator";
import { AIPitchModal } from "@/components/ai-pitch-modal";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";

const STATUS_OPTIONS: {
  value: LeadStatus;
  label: string;
  dot: string;
}[] = [
  { value: "new", label: "New", dot: "bg-blue-500" },
  { value: "contacted", label: "Contacted", dot: "bg-amber-500" },
  { value: "responded", label: "Responded", dot: "bg-emerald-500" },
  { value: "converted", label: "Converted", dot: "bg-purple-500" },
  { value: "skipped", label: "Skipped", dot: "bg-gray-400" },
];

const PAGE_SIZE = 15;

function HoursPopover({ placeId, businessName }: { placeId: string; businessName: string }) {
  const [hours, setHours] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchHours = async () => {
    if (fetched) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/place-details?placeId=${encodeURIComponent(placeId)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setHours(data.openingHours ?? null);
      setFetched(true);
    } catch {
      setError("Couldn't load hours");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-gray-400 hover:text-indigo-600"
            aria-label={`Hours for ${businessName}`}
            onClick={fetchHours}
          >
            <Clock className="size-3.5" />
          </Button>
        }
      />
      <PopoverContent className="w-64 p-0" align="end">
        <div className="px-3 py-2.5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-900 truncate" title={businessName}>
            {businessName}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Opening Hours</p>
        </div>
        <div className="px-3 py-2.5 max-h-56 overflow-y-auto">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-3.5 w-full" />
              ))}
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {!loading && !error && hours && hours.length > 0 && (
            <ul className="space-y-1">
              {hours.map((line, i) => {
                const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
                const isToday = line.toLowerCase().startsWith(today.toLowerCase());
                return (
                  <li
                    key={i}
                    className={`text-xs leading-relaxed ${
                      isToday
                        ? "font-semibold text-indigo-700 bg-indigo-50 -mx-1 px-1 py-0.5 rounded"
                        : "text-gray-600"
                    }`}
                  >
                    {line}
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && !error && (!hours || hours.length === 0) && fetched && (
            <p className="text-xs text-gray-400">No hours available</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ScorePill({ score }: { score: number }) {
  const label = getScoreLabel(score);
  if (label === "Hot") {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full tabular-nums">
        {score} · Hot
      </span>
    );
  }
  if (label === "Warm") {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full tabular-nums">
        {score} · Warm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full tabular-nums">
      {score} · Cold
    </span>
  );
}

interface SavedLeadsTableProps {
  refreshTrigger?: number;
  onLeadChange?: () => void;
}

async function fetchLeadsData(params: {
  page: number;
  filterStatus: string;
  filterCity: string;
  filterCategory: string;
}): Promise<{ leads: Lead[]; total: number }> {
  const qs = new URLSearchParams({
    limit: PAGE_SIZE.toString(),
    page: params.page.toString(),
  });
  if (params.filterStatus) qs.set("status", params.filterStatus);
  if (params.filterCity.trim()) qs.set("city", params.filterCity.trim());
  if (params.filterCategory) qs.set("category", params.filterCategory);

  const res = await fetch(`/api/leads?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load leads");
  return res.json();
}

export function SavedLeadsTable({
  refreshTrigger,
  onLeadChange,
}: SavedLeadsTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCity, setFilterCity] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [debouncedCity, setDebouncedCity] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCity(filterCity), 500);
    return () => clearTimeout(timer);
  }, [filterCity]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filterStatus, filterCategory, debouncedCity]);

  const {
    data,
    isLoading: loading,
    refetch: fetchLeads,
  } = useQuery({
    queryKey: [
      "leads",
      page,
      filterStatus,
      debouncedCity,
      filterCategory,
      refreshTrigger,
    ],
    queryFn: () =>
      fetchLeadsData({
        page,
        filterStatus,
        filterCity: debouncedCity,
        filterCategory,
      }),
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;

  const activeFilterCount = [filterStatus, filterCity, filterCategory].filter(
    Boolean
  ).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const invalidateLeads = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success(`Status → ${status}`);
        invalidateLeads();
        onLeadChange?.();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Lead removed");
        invalidateLeads();
        onLeadChange?.();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    let deleted = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
        if (res.ok) deleted++;
      } catch {
        /* continue */
      }
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${deleted} lead${deleted !== 1 ? "s" : ""}`);
    invalidateLeads();
    onLeadChange?.();
  };

  const bulkUpdateStatus = async (status: LeadStatus) => {
    const ids = Array.from(selectedIds);
    let updated = 0;
    for (const id of ids) {
      try {
        const res = await fetch("/api/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        if (res.ok) updated++;
      } catch {
        /* continue */
      }
    }
    toast.success(`Updated ${updated} leads → ${status}`);
    setSelectedIds(new Set());
    invalidateLeads();
    onLeadChange?.();
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes }),
      });
      if (res.ok) {
        invalidateLeads();
        toast.success("Notes saved");
      }
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/leads/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const getStatusDot = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.dot ?? "bg-gray-400";
  };
  const getStatusLabel = (status: string) => {
    return (
      STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold tracking-tight text-gray-900">
            {total} leads
          </h3>
          {activeFilterCount > 0 && (
            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeads()}
            disabled={loading}
            className="gap-1.5 h-8 text-xs border-gray-200"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={exporting || leads.length === 0}
            className="gap-1.5 h-8 text-xs border-gray-200"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
          <Filter className="size-3.5" />
          <span className="text-xs font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          <Select
            value={filterStatus}
            onValueChange={(v) =>
              setFilterStatus(v === "all" ? "" : (v ?? ""))
            }
          >
            <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs border-gray-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="City…"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
            className="w-full sm:w-[150px] h-8 text-xs border-gray-200"
          />

          <Select
            value={filterCategory}
            onValueChange={(v) =>
              setFilterCategory(v === "all" ? "" : (v ?? ""))
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs border-gray-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setFilterStatus("");
                setFilterCity("");
                setFilterCategory("");
              }}
            >
              <X className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
          <span className="text-xs font-semibold text-indigo-700 tabular-nums">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-indigo-200" />
          <Select
            onValueChange={(v) => bulkUpdateStatus(v as LeadStatus)}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs border-indigo-200">
              <SelectValue placeholder="Set status…" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="size-3" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs ml-auto text-gray-500"
            onClick={() => setSelectedIds(new Set())}
          >
            Deselect all
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Inbox className="size-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900">No leads yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-[280px]">
            Search for businesses and save the ones without websites to build your pipeline
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-6">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 px-4 py-4 border-b border-gray-100"
            >
              <Skeleton className="size-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && leads.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-10 pl-4">
                    <button onClick={toggleAll} className="p-0.5">
                      {selectedIds.size === leads.length ? (
                        <CheckSquare className="size-4 text-indigo-600" />
                      ) : (
                        <Square className="size-4 text-gray-300" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Business
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Website
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Score
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const needsFollowUp =
                    lead.status === "contacted" &&
                    lead.lastContactedAt &&
                    Date.now() - new Date(lead.lastContactedAt).getTime() > 7 * 86400000;

                  return (
                    <TableRow
                      key={lead.id}
                      className={`group transition-colors border-b border-gray-100 ${
                        isSelected
                          ? "bg-indigo-50/50 hover:bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <TableCell className="pl-4">
                        <button onClick={() => toggleSelect(lead.id)} className="p-0.5">
                          {isSelected ? (
                            <CheckSquare className="size-4 text-indigo-600" />
                          ) : (
                            <Square className="size-4 text-gray-300 group-hover:text-gray-400" />
                          )}
                        </button>
                      </TableCell>

                      {/* Business */}
                      <TableCell>
                        <div className="min-w-[160px] max-w-[280px]">
                          <p
                            className="font-semibold text-sm text-gray-900 leading-tight truncate"
                            title={lead.businessName}
                          >
                            {lead.businessName}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 shrink-0 text-gray-400" />
                            <span className="truncate max-w-[200px]">{lead.address}</span>
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                            {lead.category.replace(/_/g, " ")} · {lead.city}
                          </p>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
                          >
                            <Phone className="size-3.5 text-gray-400" />
                            <span className="tabular-nums">{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Website */}
                      <TableCell>
                        {lead.website ? (
                          <div className="space-y-1">
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <Globe className="size-3" />
                              <span className="truncate max-w-[90px]">
                                {(() => {
                                  try {
                                    return new URL(lead.website).hostname.replace("www.", "");
                                  } catch {
                                    return lead.website;
                                  }
                                })()}
                              </span>
                              <ExternalLink className="size-3" />
                            </a>
                            {lead.websiteStatus && lead.websiteStatus !== "ok" && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                {lead.websiteStatus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            No website
                          </span>
                        )}
                      </TableCell>

                      {/* Score */}
                      <TableCell>
                        {lead.leadScore ? (
                          <ScorePill score={lead.leadScore} />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="space-y-1">
                          <Select
                            value={lead.status}
                            onValueChange={(v) => updateStatus(lead.id, v as LeadStatus)}
                          >
                            <SelectTrigger className="h-7 w-[115px] text-xs gap-1.5 border-gray-200 bg-white">
                              <span className="flex items-center gap-1.5">
                                <span className={`size-2 rounded-full ${getStatusDot(lead.status)}`} />
                                <span className="font-medium text-gray-700">
                                  {getStatusLabel(lead.status)}
                                </span>
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    <span className={`size-2 rounded-full ${opt.dot}`} />
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {needsFollowUp && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              <Clock className="size-2.5" />
                              Follow up
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Last Contact */}
                      <TableCell>
                        {lead.lastContactedAt ? (
                          <span className="text-xs text-gray-500 tabular-nums">
                            {new Date(lead.lastContactedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EmailGenerator
                            businessName={lead.businessName}
                            category={lead.category}
                            city={lead.city}
                            hasWebsite={lead.hasWebsite}
                            websiteStatus={lead.websiteStatus}
                          />
                          {!lead.hasWebsite && (
                            <AIPitchModal
                              businessName={lead.businessName}
                              category={lead.category}
                              city={lead.city}
                              reviewCount={lead.ratingCount}
                              rating={lead.rating}
                              leadId={lead.id}
                              onContacted={() => {
                                fetchLeads();
                                onLeadChange?.();
                              }}
                            />
                          )}

                          <Popover>
                            <PopoverTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-gray-400 hover:text-gray-700 relative"
                                  aria-label={lead.notes ? "Edit notes" : "Add notes"}
                                >
                                  <StickyNote className="size-3.5" />
                                  {lead.notes && (
                                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-indigo-500" />
                                  )}
                                </Button>
                              }
                            />
                            <PopoverContent className="w-72" align="end">
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">Notes</p>
                                <Textarea
                                  placeholder="Add notes…"
                                  defaultValue={lead.notes ?? ""}
                                  rows={3}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== (lead.notes ?? "")) {
                                      updateNotes(lead.id, val);
                                    }
                                  }}
                                  className="text-sm resize-none"
                                />
                                <p className="text-[11px] text-gray-400">Saves on blur</p>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <HoursPopover
                            placeId={lead.placeId}
                            businessName={lead.businessName}
                          />

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-gray-400 hover:text-red-600"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: lead.id,
                                      name: lead.businessName,
                                    })
                                  }
                                />
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 tabular-nums">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="size-7 p-0 border-gray-200"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-gray-500 tabular-nums px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="size-7 p-0 border-gray-200"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Lead"
        description={`Remove "${deleteTarget?.name}" from your leads? This can't be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) deleteLead(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <ConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Selected"
        description={`Delete ${selectedIds.size} lead${selectedIds.size !== 1 ? "s" : ""}? This can't be undone.`}
        confirmLabel={`Delete ${selectedIds.size}`}
        variant="destructive"
        onConfirm={bulkDelete}
      />
    </div>
  );
}
