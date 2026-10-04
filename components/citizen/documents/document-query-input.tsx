"use client";

/**
 * LE-305 — Free-form AI document request input
 *
 * Allows citizens to describe their legal need in plain language
 * (English or Urdu) without selecting a template.
 */

import { useState, useRef } from "react";
import { Sparkles, ArrowRight, Loader2, Languages, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_QUERIES = [
  "Mujhe mobile chori ki FIR likhwani hai",
  "I need a legal notice for unpaid rent of PKR 80,000",
  "Mujhe university ko fee refund ke liye application chahiye",
  "My landlord is refusing to return my security deposit of PKR 50,000",
  "I want to file a complaint against my employer for wrongful dismissal",
  "Mujhe bijli ka meter connection ke liye NEPRA complaint likhni hai",
];

interface DocumentQueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

export function DocumentQueryInput({ onSubmit, isLoading }: DocumentQueryInputProps) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 5) return;
    onSubmit(trimmed);
  };

  const handleExample = (example: string) => {
    setQuery(example);
    textareaRef.current?.focus();
  };

  const charCount = query.trim().length;
  const isValid = charCount >= 5 && charCount <= 3000;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="relative rounded-xl border border-border/80 bg-white p-1 transition-all focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10">
          <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-navy">
              <Sparkles className="size-3 text-teal" aria-hidden="true" />
              AI Legal Drafting Prompt
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Languages className="size-3" aria-hidden="true" />
              English & Roman Urdu supported
            </span>
          </div>

          <Textarea
            ref={textareaRef}
            id="freeform-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your legal situation in plain words... e.g. 'Mera kirayedar 3 maheenay se rent nahi de raha, mujhe legal notice bhejna hai' or 'I need to report theft of my laptop at my workplace.'"
            rows={4}
            maxLength={3000}
            className="border-0 shadow-none resize-none text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 text-navy"
            disabled={isLoading}
            aria-label="Describe your legal document need"
          />

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-muted-foreground">
            <span className="text-[11px]">
              Be specific about dates, amounts, and parties involved.
            </span>
            <span className="text-[11px] tabular-nums font-mono">
              {charCount}/3000
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            id="freeform-submit"
            disabled={!isValid || isLoading}
            className="w-full sm:w-auto bg-navy font-semibold text-white shadow-sm hover:bg-navy-light gap-2 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Analyzing legal context…
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-gold" aria-hidden="true" />
                Draft Legal Document
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Example prompt pills */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-navy">
          <Lightbulb className="size-3.5 text-gold" aria-hidden="true" />
          <span>Need inspiration? Try an example prompt:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExample(example)}
              disabled={isLoading}
              className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-left text-xs text-navy/80 shadow-xs transition-all hover:border-navy/40 hover:bg-navy/5 hover:text-navy disabled:opacity-50"
            >
              &ldquo;{example}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
