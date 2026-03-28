"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Radar,
  Search,
  Users,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Search", icon: Search },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
];

function LeadCountBadge() {
  const { data } = useQuery({
    queryKey: ["leads-stats"],
    queryFn: async () => {
      const res = await fetch("/api/leads/stats");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30_000,
  });

  const count = data?.total ?? 0;
  if (count === 0) return null;
  return (
    <span className="ml-auto text-[10px] font-semibold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full tabular-nums leading-none">
      {count}
    </span>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col bg-gray-950 shrink-0 fixed top-0 left-0 h-screen z-50">
        <div className="px-5 h-16 flex items-center gap-3 border-b border-white/6">
          <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Radar className="size-4.5 text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white">
            LeadRadar
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("size-4", isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
                <span>{item.label}</span>
                {item.label === "Leads" && <LeadCountBadge />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/6">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <div className="size-2 rounded-full bg-emerald-500" />
            Google Places API connected
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[260px] bg-gray-950 z-50 lg:hidden transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 h-16 flex items-center justify-between border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Radar className="size-4.5 text-white" />
            </div>
            <span className="font-bold text-[15px] text-white">LeadRadar</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>
        <nav className="px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("size-4", isActive ? "text-indigo-400" : "text-gray-500")} />
                {item.label}
                {item.label === "Leads" && <LeadCountBadge />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-14 border-b bg-white sticky top-0 z-30 flex items-center px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="mr-3 text-gray-600">
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Radar className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">LeadRadar</span>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
