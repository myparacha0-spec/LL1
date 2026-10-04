"use client";

/**
 * LE-305 — Structured Document Form
 *
 * Renders the validated field form for the selected document template.
 * Handles per-field validation, error display, and submission.
 */

import { useState, useCallback } from "react";
import { Loader2, ArrowRight, TriangleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTemplate, type DocumentType } from "@/lib/citizen/documents/document-types";

interface DocumentFormProps {
  documentType: DocumentType;
  onSubmit: (data: Record<string, string>) => void;
  isLoading?: boolean;
  initialData?: Record<string, string>;
}

export function DocumentForm({
  documentType,
  onSubmit,
  isLoading,
  initialData = {},
}: DocumentFormProps) {
  const template = getTemplate(documentType);
  const [values, setValues] = useState<Record<string, string>>(initialData);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const set = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const touch = useCallback((id: string) => {
    setTouched((prev) => ({ ...prev, [id]: true }));
  }, []);

  const getError = (id: string): string | null => {
    const field = template?.fields.find((f) => f.id === id);
    if (!field?.required) return null;
    const val = values[id]?.trim() ?? "";
    if (!val && (touched[id] || submitAttempted)) {
      return `${field.label} is required.`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!template) return;

    // Check all required fields
    const missing = template.fields.filter(
      (f) => f.required && !values[f.id]?.trim()
    );

    if (missing.length > 0) {
      const firstId = missing[0]?.id;
      if (firstId) {
        document.getElementById(`field-${firstId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    onSubmit(values);
  };

  if (!template) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Unknown document type: {documentType}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-4">
        {template.fields.map((field) => {
          const error = getError(field.id);
          const value = values[field.id] ?? "";
          const fieldId = `field-${field.id}`;

          return (
            <div
              key={field.id}
              id={fieldId}
              className="space-y-1.5 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs transition-colors focus-within:border-navy/30"
            >
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`input-${field.id}`}
                  className="text-xs font-semibold text-navy"
                >
                  {field.label}
                  {field.required ? (
                    <span className="ml-1 text-destructive font-bold" aria-hidden="true">
                      *
                    </span>
                  ) : (
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  )}
                </Label>
              </div>

              {/* Select */}
              {field.type === "select" && field.options ? (
                <Select
                  value={value}
                  onValueChange={(v) => {
                    set(field.id, v);
                    touch(field.id);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id={`input-${field.id}`}
                    className={`h-10 text-sm ${error ? "border-destructive ring-1 ring-destructive" : ""}`}
                    aria-invalid={!!error}
                  >
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                /* Textarea */
                <Textarea
                  id={`input-${field.id}`}
                  value={value}
                  onChange={(e) => set(field.id, e.target.value)}
                  onBlur={() => touch(field.id)}
                  placeholder={field.placeholder}
                  rows={4}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  aria-describedby={
                    error
                      ? `error-${field.id}`
                      : field.hint
                      ? `hint-${field.id}`
                      : undefined
                  }
                  className={`resize-y text-sm leading-relaxed ${
                    error ? "border-destructive ring-1 ring-destructive" : ""
                  }`}
                />
              ) : field.type === "date" ? (
                /* Date */
                <Input
                  id={`input-${field.id}`}
                  type="date"
                  value={value}
                  onChange={(e) => set(field.id, e.target.value)}
                  onBlur={() => touch(field.id)}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  aria-describedby={error ? `error-${field.id}` : undefined}
                  className={`h-10 text-sm ${error ? "border-destructive ring-1 ring-destructive" : ""}`}
                  max={new Date().toISOString().split("T")[0]}
                />
              ) : (
                /* Text */
                <Input
                  id={`input-${field.id}`}
                  type="text"
                  value={value}
                  onChange={(e) => set(field.id, e.target.value)}
                  onBlur={() => touch(field.id)}
                  placeholder={field.placeholder}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  aria-describedby={
                    error
                      ? `error-${field.id}`
                      : field.hint
                      ? `hint-${field.id}`
                      : undefined
                  }
                  className={`h-10 text-sm ${error ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
              )}

              {/* Hint */}
              {field.hint && !error && (
                <p id={`hint-${field.id}`} className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="size-3 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                  <span>{field.hint}</span>
                </p>
              )}

              {/* Error */}
              {error && (
                <p
                  id={`error-${field.id}`}
                  role="alert"
                  className="flex items-center gap-1 text-xs text-destructive font-medium mt-1"
                >
                  <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-3">
        <Button
          type="submit"
          id="document-form-submit"
          disabled={isLoading}
          className="w-full bg-navy font-semibold text-white shadow-sm hover:bg-navy-light gap-2 h-11"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Generating {template.label}…
            </>
          ) : (
            <>
              Generate {template.label}
              <ArrowRight className="size-4 text-gold" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
