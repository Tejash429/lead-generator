"use client";

import { useQueryClient } from "@tanstack/react-query";
import { SavedLeadsTable } from "@/components/saved-leads-table";
import { LeadsOverviewStats } from "@/components/leads-overview-stats";

export default function LeadsPage() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads-stats"] });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Lead Pipeline
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          Track outreach, manage status, and convert saved leads
        </p>
      </div>

      {/* Stats */}
      <LeadsOverviewStats />

      {/* Table */}
      <SavedLeadsTable onLeadChange={handleRefresh} />
    </div>
  );
}
