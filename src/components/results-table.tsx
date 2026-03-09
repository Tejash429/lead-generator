"use client";

import { useState } from "react";
import {
  Globe,
  Phone,
  MapPin,
  Star,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Save,
  Check,
  ExternalLink,
  Loader2,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AnalyzedBusiness } from "@/types";
import { getScoreColor, getScoreLabel } from "@/lib/lead-scoring";
import { EmailGenerator } from "@/components/email-generator";
import { toast } from "sonner";

interface ResultsTableProps {
  businesses: AnalyzedBusiness[];
  city: string;
  category: string;
  onSaveComplete: () => void;
}

function WebsiteStatusBadge({ business }: { business: AnalyzedBusiness }) {
  if (!business.website) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/8 px-2 py-1 rounded-md">
        <XCircle className="size-3" />
        No Website
      </span>
    );
  }

  const status = business.websiteAnalysis?.status;

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/8 px-2 py-1 rounded-md">
        <XCircle className="size-3" />
        Broken
      </span>
    );
  }

  if (status === "slow") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
        <AlertTriangle className="size-3" />
        Slow
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
      <CheckCircle className="size-3" />
      OK
    </span>
  );
}

export function ResultsTable({
  businesses,
  city,
  category,
  onSaveComplete,
}: ResultsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(
      businesses
        .filter((b) => b.isLead && !b.alreadySaved)
        .map((b) => b.placeId)
    )
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSelect = (placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === businesses.length) setSelected(new Set());
    else setSelected(new Set(businesses.map((b) => b.placeId)));
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

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {businesses.length} businesses found
          </h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">
              {leads.length} potential leads
            </span>
            {" — "}no website or poor web presence
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={selected.size === 0 || saving}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : saved ? (
            <Check className="size-3.5" />
          ) : (
            <Save className="size-3.5" />
          )}
          {saved ? "Saved!" : `Save ${selected.size} selected`}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 pl-4">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === businesses.length &&
                      businesses.length > 0
                    }
                    onChange={toggleAll}
                    className="size-3.5 rounded accent-primary cursor-pointer"
                  />
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
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((biz) => (
                <TableRow
                  key={biz.placeId}
                  className={
                    biz.isLead
                      ? "bg-primary/[0.02] hover:bg-primary/[0.05] dark:bg-primary/[0.04] dark:hover:bg-primary/[0.07]"
                      : "hover:bg-muted/30"
                  }
                >
                  <TableCell className="pl-4">
                    <input
                      type="checkbox"
                      checked={selected.has(biz.placeId)}
                      onChange={() => toggleSelect(biz.placeId)}
                      className="size-3.5 rounded accent-primary cursor-pointer"
                    />
                  </TableCell>

                  {/* Business */}
                  <TableCell>
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm leading-tight">
                          {biz.name}
                        </p>
                        {biz.alreadySaved && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded cursor-default">
                                  <BookmarkCheck className="size-2.5" />
                                  Saved
                                </span>
                              }
                            />
                            <TooltipContent>Already saved</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 leading-tight">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate max-w-[220px]">
                          {biz.address}
                        </span>
                      </p>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    {biz.phone ? (
                      <a
                        href={`tel:${biz.phone}`}
                        className="text-sm flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors group"
                      >
                        <Phone className="size-3.5 text-muted-foreground group-hover:text-primary" />
                        <span className="tabular-nums">{biz.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        —
                      </span>
                    )}
                  </TableCell>

                  {/* Website */}
                  <TableCell>
                    <div className="space-y-1">
                      <WebsiteStatusBadge business={biz} />
                      {biz.websiteAnalysis?.reason && biz.isLead && (
                        <p className="text-[11px] text-muted-foreground max-w-[160px] leading-tight">
                          {biz.websiteAnalysis.reason}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell>
                    {biz.rating ? (
                      <div className="flex items-center gap-1.5">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium tabular-nums">
                          {biz.rating}
                        </span>
                        {biz.ratingCount && (
                          <span className="text-[11px] text-muted-foreground">
                            ({biz.ratingCount})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        —
                      </span>
                    )}
                  </TableCell>

                  {/* Score */}
                  <TableCell>
                    {(() => {
                      const colors = getScoreColor(biz.leadScore);
                      const label = getScoreLabel(biz.leadScore);
                      return (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <div className="flex items-center gap-1.5 cursor-default">
                                <span
                                  className={`text-sm font-bold tabular-nums ${colors.text}`}
                                >
                                  {biz.leadScore}
                                </span>
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
                                >
                                  {label}
                                </span>
                              </div>
                            }
                          />
                          <TooltipContent>
                            Priority score (1–100)
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {biz.website && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <a
                                href={biz.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              />
                            }
                          >
                            <ExternalLink className="size-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {(() => {
                              try {
                                return new URL(biz.website!).hostname.replace(
                                  "www.",
                                  ""
                                );
                              } catch {
                                return "Visit site";
                              }
                            })()}
                          </TooltipContent>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
