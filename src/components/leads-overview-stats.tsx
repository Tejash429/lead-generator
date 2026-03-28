"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Sparkles, Mail, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  total: number;
  new: number;
  contacted: number;
  converted: number;
}

async function fetchLeadStats(): Promise<StatsData> {
  const res = await fetch("/api/leads/stats");
  if (!res.ok) return { total: 0, new: 0, contacted: 0, converted: 0 };
  return res.json();
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-5 space-y-4"
        >
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface LeadsOverviewStatsProps {
  refreshTrigger?: number;
}

export function LeadsOverviewStats({ refreshTrigger }: LeadsOverviewStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["leads-stats", refreshTrigger],
    queryFn: fetchLeadStats,
  });

  if (isLoading || !stats) return <StatsSkeleton />;

  const conversionRate =
    stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;

  const statItems = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: Users,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      label: "Hot Leads",
      value: stats.new,
      icon: Sparkles,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Contacted",
      value: stats.contacted,
      icon: Mail,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Converted",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`size-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}
            >
              <stat.icon className={`size-4 ${stat.iconColor}`} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-gray-900">
            {stat.value}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
