"use client";

/**
 * LE-305 — Document Template Grid
 *
 * Displays the four document type cards (FIR, Complaint, Legal Notice,
 * Application) for the citizen to select before filling a structured form.
 */

import { Check } from "lucide-react";
import { DOCUMENT_TEMPLATES } from "@/lib/citizen/documents/document-types";
import type { DocumentType } from "@/lib/citizen/documents/document-types";
import { cn } from "@/lib/utils";

interface DocumentTemplateGridProps {
  onSelect: (type: DocumentType) => void;
  selected?: DocumentType | null;
}

const TEMPLATE_SUBTITLES: Record<DocumentType, string> = {
  fir: "Pakistan Penal Code & CrPC Sec 154",
  complaint: "Consumer & Regulatory Authorities",
  legal_notice: "Civil & Commercial Pre-litigation",
  application: "Government & University Petitions",
};

export function DocumentTemplateGrid({ onSelect, selected }: DocumentTemplateGridProps) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      {DOCUMENT_TEMPLATES.map((template) => {
        const isSelected = selected === template.type;
        const subtitle = TEMPLATE_SUBTITLES[template.type];

        return (
          <button
            key={template.type}
            id={`template-${template.type}`}
            type="button"
            onClick={() => onSelect(template.type)}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all duration-150",
              "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
              isSelected
                ? "border-navy bg-navy/[0.03] shadow-sm ring-1 ring-navy"
                : "border-border/80 bg-white hover:border-navy/40 hover:bg-slate-50/50"
            )}
            aria-pressed={isSelected}
          >
            {/* Selected Indicator */}
            {isSelected && (
              <span className="absolute right-3.5 top-3.5 flex size-5 items-center justify-center rounded-full bg-navy text-white shadow-xs">
                <Check className="size-3" strokeWidth={3} aria-hidden="true" />
              </span>
            )}

            <div>
              {/* Header Icon & Subtitle */}
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-slate-100/90 text-2xl shadow-xs ring-1 ring-slate-200/60 transition-transform duration-150 group-hover:scale-105">
                  {template.icon}
                </span>
                <div>
                  <h3 className="font-heading text-sm font-bold text-navy group-hover:text-navy-light">
                    {template.label}
                  </h3>
                  {subtitle && (
                    <p className="text-[11px] font-medium text-teal mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-navy">
              <span className="text-muted-foreground group-hover:text-navy transition-colors">
                {isSelected ? "Selected template" : "Select this template"}
              </span>
              <span className="text-teal group-hover:translate-x-0.5 transition-transform">
                Configure →
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
