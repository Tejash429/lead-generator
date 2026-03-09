"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Radar,
  Search,
  Users,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Search",
    icon: Search,
    description: "Find leads",
  },
  {
    href: "/dashboard/leads",
    label: "Leads",
    icon: Users,
    description: "Manage pipeline",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[220px] flex-col border-r bg-card/50 shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center gap-2.5 border-b">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
            <Radar className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">
            LeadRadar
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-2 pb-2 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            Menu
          </p>
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
                  "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="size-3.5 text-primary/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-3 border-t">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground">
            <BarChart3 className="size-3.5" />
            <span>Google Places API</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b bg-card/60 backdrop-blur-sm sticky top-0 z-40 flex items-center shrink-0">
          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
            {/* Mobile logo + nav */}
            <div className="flex items-center gap-4 lg:hidden">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
              >
                <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                  <Radar className="size-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">LeadRadar</span>
              </Link>
            </div>

            {/* Mobile nav tabs */}
            <nav className="flex items-center gap-1 lg:hidden">
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
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Breadcrumb on desktop */}
            <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {pathname === "/dashboard"
                  ? "Search"
                  : pathname.startsWith("/dashboard/leads")
                    ? "Leads"
                    : "Dashboard"}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 dot-grid-bg">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
