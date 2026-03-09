"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Sparkles,
  Mail,
  TrendingUp,
} from "lucide-react";

interface LeadsOverviewStatsProps {
  refreshTrigger: number;
}

interface StatsData {
  total: number;
  new: number;
  contacted: number;
  converted: number;
}

export function LeadsOverviewStats({
  refreshTrigger,
}: LeadsOverviewStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/leads/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Silently fail
      }
    }
    fetchStats();
  }, [refreshTrigger]);

  const conversionRate =
    stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;

  const statItems = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: Users,
      accent: "text-foreground",
      iconColor: "text-muted-foreground",
    },
    {
      label: "New",
      value: stats.new,
      icon: Sparkles,
      accent: "text-primary",
      iconColor: "text-primary/70",
    },
    {
      label: "Contacted",
      value: stats.contacted,
      icon: Mail,
      accent: "text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500/70",
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      accent: "text-emerald-600 dark:text-emerald-400",
      iconColor: "text-emerald-500/70",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="relative rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30"
        >
          <div className="flex items-start justify-between mb-3">
            <stat.icon className={`size-4 ${stat.iconColor}`} />
          </div>
          <p
            className={`text-2xl font-bold tracking-tight tabular-nums ${stat.accent}`}
          >
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
