"use client";

import { useState } from "react";
import { SavedLeadsTable } from "@/components/saved-leads-table";
import { LeadsOverviewStats } from "@/components/leads-overview-stats";
import { Target } from "lucide-react";

export default function LeadsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded flex items-center justify-center bg-primary/10">
            <Target className="size-3 text-primary" />
          </div>
          <h2 className="text-[13px] font-semibold text-primary tracking-wide uppercase">
            Lead Pipeline
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Track outreach, manage status, and convert saved leads
        </p>
      </div>

      {/* Stats */}
      <LeadsOverviewStats refreshTrigger={refreshKey} />

      {/* Table */}
      <SavedLeadsTable
        refreshTrigger={refreshKey}
        onLeadChange={handleRefresh}
      />
    </div>
  );
}
