"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Sparkles,
  BookOpen,
  Search,
  User,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CITIZEN_LINKS = [
  {
    href: "/citizen/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/citizen/documents",
    label: "My Documents",
    icon: FileText,
    exact: true,
  },
  {
    href: "/citizen/documents/create",
    label: "Draft Document",
    icon: PlusCircle,
    exact: false,
    badge: "AI",
  },
  {
    href: "/ai-assistant",
    label: "AI Assistant",
    icon: Sparkles,
    exact: false,
  },
  {
    href: "/resources",
    label: "Legal Resources",
    icon: BookOpen,
    exact: false,
  },
  {
    href: "/lawyers",
    label: "Find Lawyer",
    icon: Search,
    exact: false,
  },
  {
    href: "/citizen/profile",
    label: "My Profile",
    icon: User,
    exact: true,
  },
];

export function CitizenNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Citizen portal navigation"
      className="sticky top-16 z-40 border-b border-border/80 bg-white/95 backdrop-blur-md transition-all shadow-[0_1px_3px_rgba(15,39,71,0.04)]"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Horizontal scrollable nav for all viewport sizes */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none sm:gap-1.5">
          <div className="mr-2 hidden items-center gap-1.5 rounded-md bg-navy/5 px-2.5 py-1 text-xs font-semibold text-navy md:flex">
            <ShieldCheck className="size-3.5 text-teal" aria-hidden="true" />
            <span>Citizen Portal</span>
          </div>

          {CITIZEN_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 sm:text-sm",
                  isActive
                    ? "bg-navy text-white shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-navy"
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 sm:size-4 shrink-0 transition-transform",
                    isActive ? "text-gold" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={cn(
                      "ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider",
                      isActive
                        ? "bg-gold text-navy-dark"
                        : "bg-teal-soft text-teal"
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
