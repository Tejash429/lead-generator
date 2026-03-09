"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { Lead, LeadStatus } from "@/types";
import { BUSINESS_CATEGORIES as CATEGORIES } from "@/types";
import { getScoreColor, getScoreLabel } from "@/lib/lead-scoring";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { EmailGenerator } from "@/components/email-generator";
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

interface SavedLeadsTableProps {
  refreshTrigger: number;
  onLeadChange?: () => void;
}

export function SavedLeadsTable({
  refreshTrigger,
  onLeadChange,
}: SavedLeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCity, setFilterCity] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const activeFilterCount = [filterStatus, filterCity, filterCategory].filter(
    Boolean
  ).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        page: page.toString(),
      });
      if (filterStatus) params.set("status", filterStatus);
      if (filterCity.trim()) params.set("city", filterCity.trim());
      if (filterCategory) params.set("category", filterCategory);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Fetch leads error:", err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCity, filterCategory, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshTrigger]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    if (!filterCity) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCity]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status } : l))
        );
        toast.success(`Status → ${status}`);
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
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setTotal((t) => t - 1);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Lead removed");
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
    fetchLeads();
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
    fetchLeads();
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
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, notes } : l))
        );
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
          <h3 className="text-base font-semibold tracking-tight">
            {total} leads
          </h3>
          {activeFilterCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLeads}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <RefreshCw
                    className={`size-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline text-xs">Refresh</span>
                </Button>
              }
            />
            <TooltipContent>Refresh leads</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  disabled={exporting || leads.length === 0}
                  className="gap-1.5"
                >
                  {exporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  <span className="hidden sm:inline text-xs">Export</span>
                </Button>
              }
            />
            <TooltipContent>Download CSV</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
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
            <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${opt.dot}`}
                    />
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
            className="w-full sm:w-[150px] h-8 text-xs"
          />

          <Select
            value={filterCategory}
            onValueChange={(v) =>
              setFilterCategory(v === "all" ? "" : (v ?? ""))
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
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
              className="h-8 text-xs gap-1 text-muted-foreground"
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
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
          <span className="text-xs font-semibold text-primary tabular-nums">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-primary/20" />
          <Select
            onValueChange={(v) => bulkUpdateStatus(v as LeadStatus)}
          >
            <SelectTrigger className="h-7 w-[130px] text-xs border-primary/20">
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
            className="h-7 text-xs ml-auto"
            onClick={() => setSelectedIds(new Set())}
          >
            Deselect all
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Inbox className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">
            No leads yet
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Search for businesses and save the ones without websites to build
            your pipeline
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!loading && leads.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 pl-4">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            onClick={toggleAll}
                            className="p-0.5"
                          >
                            {selectedIds.size === leads.length ? (
                              <CheckSquare className="size-4 text-primary" />
                            ) : (
                              <Square className="size-4 text-muted-foreground" />
                            )}
                          </button>
                        }
                      />
                      <TooltipContent>Select all</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Business
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Website
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rating
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Score
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);

                  return (
                    <TableRow
                      key={lead.id}
                      className={
                        isSelected
                          ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                          : "hover:bg-muted/30"
                      }
                    >
                      <TableCell className="pl-4">
                        <button
                          onClick={() => toggleSelect(lead.id)}
                          className="p-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>

                      {/* Business */}
                      <TableCell>
                        <div className="min-w-[160px]">
                          <p className="font-medium text-sm leading-tight">
                            {lead.businessName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {lead.address}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5 capitalize">
                            {lead.category.replace(/_/g, " ")} · {lead.city}
                          </p>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors group"
                          >
                            <Phone className="size-3.5 text-muted-foreground group-hover:text-primary" />
                            <span className="tabular-nums">{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            —
                          </span>
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
                              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Globe className="size-3" />
                              <span className="truncate max-w-[90px]">
                                {(() => {
                                  try {
                                    return new URL(lead.website)
                                      .hostname.replace("www.", "");
                                  } catch {
                                    return lead.website;
                                  }
                                })()}
                              </span>
                              <ExternalLink className="size-3" />
                            </a>
                            {lead.websiteStatus &&
                              lead.websiteStatus !== "ok" && (
                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                  {lead.websiteStatus}
                                </span>
                              )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-destructive bg-destructive/8 px-2 py-0.5 rounded">
                            No website
                          </span>
                        )}
                      </TableCell>

                      {/* Rating */}
                      <TableCell>
                        {lead.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm tabular-nums">
                              {lead.rating}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Score */}
                      <TableCell>
                        {lead.leadScore
                          ? (() => {
                              const colors = getScoreColor(lead.leadScore);
                              const label = getScoreLabel(lead.leadScore);
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-sm font-bold tabular-nums ${colors.text}`}
                                  >
                                    {lead.leadScore}
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
                                  >
                                    {label}
                                  </span>
                                </div>
                              );
                            })()
                          : (
                            <span className="text-xs text-muted-foreground/60">
                              —
                            </span>
                          )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(v) =>
                            updateStatus(lead.id, v as LeadStatus)
                          }
                        >
                          <SelectTrigger className="h-7 w-[115px] text-xs gap-1.5 border-0 bg-muted/50 hover:bg-muted">
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`size-2 rounded-full ${getStatusDot(lead.status)}`}
                              />
                              <span className="font-medium">
                                {getStatusLabel(lead.status)}
                              </span>
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`size-2 rounded-full ${opt.dot}`}
                                  />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <EmailGenerator
                            businessName={lead.businessName}
                            category={lead.category}
                            city={lead.city}
                            hasWebsite={lead.hasWebsite}
                            websiteStatus={lead.websiteStatus}
                          />

                          <Popover>
                            <PopoverTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-foreground relative"
                                  aria-label={
                                    lead.notes ? "Edit notes" : "Add notes"
                                  }
                                >
                                  <StickyNote className="size-3.5" />
                                  {lead.notes && (
                                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
                                  )}
                                </Button>
                              }
                            />
                            <PopoverContent className="w-72" align="end">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Notes</p>
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
                                <p className="text-[11px] text-muted-foreground">
                                  Saves on blur
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
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
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground tabular-nums">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="size-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="size-7 p-0"
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
