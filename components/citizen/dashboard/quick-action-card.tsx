"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ComingSoonDialog } from "@/components/citizen/dashboard/coming-soon-dialog";

interface QuickActionCardProps {
  /** Pre-rendered icon element (e.g. `<Search className="size-5" />`). */
  icon: ReactNode;
  title: string;
  description: string;
  /** Real destination. When provided the card navigates there. */
  href?: string;
  /** When true the card opens the "in development" dialog instead of navigating. */
  comingSoon?: boolean;
  /** Optional badge text like "AI Powered" or "Essential" */
  badge?: string;
}

export function QuickActionCard({
  icon,
  title,
  description,
  href,
  comingSoon = false,
  badge,
}: QuickActionCardProps) {
  const overlayClasses = cn(
    "absolute inset-0 z-10 rounded-2xl outline-none",
    "focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
  );

  return (
    <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-white p-0 transition-all duration-200 hover:-translate-y-1 hover:border-navy/30 hover:shadow-lg hover:shadow-navy/5">
      {/* Top accent line on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-gold to-teal opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <CardContent className="flex h-full flex-col justify-between p-6">
        <div>
          {/* Header row: Icon + optional badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="grid size-12 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-navy shadow-xs transition-colors duration-200 group-hover:border-navy/20 group-hover:bg-navy group-hover:text-white">
              {icon}
            </span>

            {badge ? (
              <span className="rounded-full border border-teal/30 bg-teal-soft px-2.5 py-0.5 text-[11px] font-semibold text-teal uppercase tracking-wider">
                {badge}
              </span>
            ) : comingSoon ? (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                In Development
              </span>
            ) : null}
          </div>

          {/* Title & Description */}
          <div className="mt-4 space-y-1.5">
            <h3 className="font-heading text-base font-bold text-navy transition-colors group-hover:text-navy-light">
              {title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {/* Footer Action link indicator */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-navy group-hover:text-teal transition-colors">
            {comingSoon ? "Request preview" : "Launch service"}
          </span>
          <span className="grid size-7 place-items-center rounded-full bg-slate-50 text-muted-foreground transition-all duration-200 group-hover:bg-navy group-hover:text-white group-hover:translate-x-0.5">
            {comingSoon ? (
              <ArrowRight className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            )}
          </span>
        </div>
      </CardContent>

      {comingSoon ? (
        <ComingSoonDialog feature={title}>
          <button type="button" className={overlayClasses}>
            <span className="sr-only">{title} — in development</span>
          </button>
        </ComingSoonDialog>
      ) : (
        <Link href={href ?? "#"} aria-label={title} className={overlayClasses} />
      )}
    </Card>
  );
}
