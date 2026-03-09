"use client";

import {
  Building2,
  Target,
  Globe,
  AlertTriangle,
} from "lucide-react";

interface StatsCardsProps {
  totalSearched: number;
  leadsFound: number;
  noWebsite: number;
  slowWebsite: number;
}

export function StatsCards({
  totalSearched,
  leadsFound,
  noWebsite,
  slowWebsite,
}: StatsCardsProps) {
  const leadRate = totalSearched > 0 ? Math.round((leadsFound / totalSearched) * 100) : 0;

  const stats = [
    {
      label: "Businesses",
      value: totalSearched,
      icon: Building2,
      accent: "text-foreground",
      iconColor: "text-muted-foreground",
    },
    {
      label: "Leads found",
      value: leadsFound,
      suffix: `${leadRate}%`,
      icon: Target,
      accent: "text-primary",
      iconColor: "text-primary",
    },
    {
      label: "No website",
      value: noWebsite,
      icon: Globe,
      accent: "text-destructive",
      iconColor: "text-destructive/70",
    },
    {
      label: "Slow / broken",
      value: slowWebsite,
      icon: AlertTriangle,
      accent: "text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500/70",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30"
        >
          <div className="flex items-start justify-between mb-3">
            <stat.icon className={`size-4 ${stat.iconColor}`} />
            {stat.suffix && (
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {stat.suffix}
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold tracking-tight tabular-nums ${stat.accent}`}>
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
