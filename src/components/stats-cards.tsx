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
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      label: "Leads found",
      value: leadsFound,
      suffix: `${leadRate}%`,
      icon: Target,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "No website",
      value: noWebsite,
      icon: Globe,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Slow / broken",
      value: slowWebsite,
      icon: AlertTriangle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`size-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon className={`size-4 ${stat.iconColor}`} />
            </div>
            {stat.suffix && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {stat.suffix}
              </span>
            )}
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
