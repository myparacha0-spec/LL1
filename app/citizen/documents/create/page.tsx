"use client";

/**
 * /citizen/documents/create
 *
 * LE-305 — Legal Document Generator UI
 *
 * Two modes:
 *  - Template: Select a document type → fill structured form → generate
 *  - Free-form: Describe need in plain language → AI generates / asks questions
 *
 * After generation:
 *  - Preview document in professional Legal Paper format
 *  - Edit inline with real-time feedback
 *  - Save to citizen_documents → navigate to saved document
 *  - Export as real .txt file
 */

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FileText,
  ChevronLeft,
  Download,
  Save,
  TriangleAlert,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Loader2,
  PenLine,
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentTemplateGrid } from "@/components/citizen/documents/document-template-grid";
import { DocumentForm } from "@/components/citizen/documents/document-form";
import { DocumentQueryInput } from "@/components/citizen/documents/document-query-input";
import type { DocumentType } from "@/lib/citizen/documents/document-types";
import { getTemplateLabel } from "@/lib/citizen/documents/document-types";
import type { GenerationResponse } from "@/lib/citizen/documents/document-schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "input" | "result";
type Mode = "template" | "freeform";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callGenerateApi(payload: unknown): Promise<GenerationResponse> {
  const res = await fetch("/api/citizen/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: GenerationResponse;
    error?: string;
    details?: unknown;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Generation failed.");
  }
  return json.data!;
}

async function callSaveApi(payload: unknown): Promise<{ id: string; title: string }> {
  const res = await fetch("/api/citizen/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { id: string; title: string };
    error?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Save failed.");
  }
  return json.data!;
}

async function callUpdateApi(
  id: string,
  payload: { title?: string; generated_content?: string }
): Promise<void> {
  const res = await fetch(`/api/citizen/documents?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { success?: boolean; error?: string };
  if (!res.ok || !json.success) throw new Error(json.error ?? "Update failed.");
}

function exportTextFile(filename: string, textContent: string): void {
  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename
    .replace(/[^a-z0-9 ]/gi, "")
    .replace(/\s+/g, "_")
    .toLowerCase()}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Result panel (Legal Paper Presentation)
// ---------------------------------------------------------------------------

function GenerationResult({
  result,
  onBack,
  documentType,
  inputData,
  mode,
  freeformQuery,
}: {
  result: GenerationResponse;
  onBack: () => void;
  documentType?: DocumentType | null;
  inputData?: Record<string, string>;
  mode: Mode;
  freeformQuery?: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(result.generated_content);
  const [title, setTitle] = useState(result.title || "Generated Legal Document");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.trim() ? content.split("\n").length : 0;

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setSaveError("Title cannot be empty.");
      return;
    }
    if (!content.trim()) {
      setSaveError("Document content cannot be empty.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const docType =
        documentType ?? (result.document_type as DocumentType) ?? "application";
      const payload = {
        template_id: docType,
        title: title.trim(),
        document_type: result.document_type || docType,
        input_data:
          mode === "template"
            ? inputData ?? {}
            : { freeform_query: freeformQuery ?? "" },
        generated_content: content,
        status: "draft",
      };
      const saved = await callSaveApi(payload);
      setSavedId(saved.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }, [title, content, documentType, result.document_type, mode, inputData, freeformQuery]);

  const handleUpdateSaved = useCallback(async () => {
    if (!savedId) return;
    if (!title.trim()) {
      setSaveError("Title cannot be empty.");
      return;
    }
    if (!content.trim()) {
      setSaveError("Document content cannot be empty.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await callUpdateApi(savedId, {
        title: title.trim(),
        generated_content: content,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setIsSaving(false);
    }
  }, [savedId, title, content]);

  const handleExport = useCallback(() => {
    try {
      if (!content.trim()) {
        setExportError("Nothing to export — document is empty.");
        return;
      }
      setExportError(null);
      exportTextFile(title || "document", content);
    } catch {
      setExportError("Export failed. Please try again.");
    }
  }, [content, title]);

  const handleOpenSaved = useCallback(() => {
    if (savedId) {
      router.push(`/citizen/documents/${savedId}`);
    }
  }, [savedId, router]);

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-navy transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to templates
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-8 gap-1.5"
            title="Copy text to clipboard"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-teal" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Copy
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            id="export-document"
            onClick={handleExport}
            className="text-xs h-8 gap-1.5 font-medium border-slate-200"
            aria-label="Export document as text file"
          >
            <Download className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Export .txt
          </Button>

          {savedId ? (
            <>
              <Button
                size="sm"
                variant="outline"
                id="update-document"
                onClick={handleUpdateSaved}
                disabled={isSaving}
                className="text-xs h-8 gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5 text-muted-foreground" aria-hidden="true" />
                )}
                Update
              </Button>
              <Button
                size="sm"
                id="open-saved-document"
                onClick={handleOpenSaved}
                className="text-xs h-8 gap-1.5 bg-navy font-semibold text-white hover:bg-navy-light shadow-xs"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Open Document
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              id="save-document"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs h-8 gap-1.5 bg-navy font-semibold text-white hover:bg-navy-light shadow-xs"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-3.5" aria-hidden="true" />
              )}
              Save to My Documents
            </Button>
          )}
        </div>
      </div>

      {/* Save Success Banner */}
      {savedId && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded-xl bg-teal-soft/80 border border-teal/40 px-4 py-3 text-xs sm:text-sm text-teal font-medium"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-teal" aria-hidden="true" />
            <span>Document successfully saved to your LegalEase repository.</span>
          </div>
          <button
            type="button"
            onClick={handleOpenSaved}
            className="underline font-semibold hover:no-underline shrink-0 text-navy"
          >
            View in My Documents →
          </button>
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs sm:text-sm text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Export Error */}
      {exportError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs sm:text-sm text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Needs more info alert */}
      {!result.is_ready && result.questions && result.questions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-amber-700 shrink-0" aria-hidden="true" />
              <p className="text-xs sm:text-sm font-semibold text-amber-900">
                Additional Information Required for Official Filing:
              </p>
            </div>
            <ul className="space-y-1.5 pl-6">
              {result.questions.map((q, i) => (
                <li key={i} className="list-decimal text-xs text-amber-800 leading-relaxed">
                  {q}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings alert */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <TriangleAlert className="size-3.5 shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Title Field */}
      <div className="space-y-1.5">
        <Label htmlFor="doc-title" className="text-xs font-semibold text-navy uppercase tracking-wider">
          Document Title
        </Label>
        <Input
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-heading font-bold text-navy text-base sm:text-lg bg-white border-slate-200"
          placeholder="e.g. Formal Legal Notice for Eviction"
          aria-required="true"
        />
      </div>

      {/* Document Legal Paper Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden">
        {/* Legal Paper Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-navy">
            <Scale className="size-4 text-teal" aria-hidden="true" />
            <span>Legal Instrument Preview</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-normal text-muted-foreground font-mono">
              {wordCount} words · {lineCount} lines
            </span>
          </div>

          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              id="edit-document"
              onClick={handleEdit}
              className="gap-1.5 text-xs h-7 border-slate-200 bg-white"
            >
              <PenLine className="size-3" aria-hidden="true" />
              Edit Text
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="gap-1.5 text-xs h-7 bg-navy text-white hover:bg-navy-light"
            >
              <Check className="size-3" aria-hidden="true" />
              Done Editing
            </Button>
          )}
        </div>

        {/* Paper Content */}
        <div className="p-6 sm:p-8 bg-[#FAFAFA]">
          {isEditing ? (
            <Textarea
              ref={textareaRef}
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={22}
              className="w-full rounded-xl border border-slate-200 bg-white p-5 font-mono text-xs sm:text-sm leading-relaxed resize-y shadow-inner text-navy"
              aria-label="Edit document content"
            />
          ) : (
            <div
              id="doc-content"
              className="min-h-[380px] rounded-xl border border-slate-200/80 bg-white p-6 sm:p-8 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-mono text-navy shadow-xs selection:bg-gold/20"
              aria-label="Generated document content"
            >
              {content || (
                <span className="text-muted-foreground italic">No document content available.</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RAG sources / Legal Citations */}
      {((result.citations && result.citations.length > 0) ||
        (result.rag_sources && result.rag_sources.length > 0)) && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-navy uppercase tracking-wider">
            <BookOpen className="size-3.5 text-teal" aria-hidden="true" />
            Statutory References Grounding this Draft
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.citations?.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-navy/15 bg-navy/5 px-2.5 py-1 text-xs text-navy font-medium"
              >
                <ShieldCheck className="size-3 text-teal" aria-hidden="true" />
                {c.title}
                {c.section ? ` · Sec ${c.section}` : ""}
              </span>
            ))}
            {result.rag_sources
              ?.filter((s) => !result.citations?.some((c) => c.title === s.title))
              .map((s, i) => (
                <span
                  key={`src-${i}`}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {s.title}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* AI Draft Warning */}
      <div className="flex items-center gap-2.5 rounded-xl border border-navy/10 bg-navy/5 p-3.5">
        <FileText className="size-4 shrink-0 text-navy" aria-hidden="true" />
        <p className="text-xs text-navy/80 leading-relaxed">
          <strong className="font-semibold text-navy">AI-Assisted Legal Instrument</strong> — This
          draft was produced using verified Pakistan legal statutes. Carefully review all party names,
          dates, and specific claims before proceeding.
        </p>
      </div>

      {/* Statutory Disclaimer */}
      <div className="rounded-xl border border-gold/40 bg-gold-soft/50 p-4">
        <p className="text-xs leading-relaxed text-navy/90">
          <strong className="font-semibold text-navy">Legal Disclaimer: </strong>
          {result.disclaimer ||
            "This document is an AI-assisted draft for informational and preparatory purposes. It does not replace advice from an enrolled advocate."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Create Document Page
// ---------------------------------------------------------------------------

export default function CreateDocumentPage() {
  const [mode, setMode] = useState<Mode>("template");
  const [step, setStep] = useState<Step>("input");
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [lastInputData, setLastInputData] = useState<Record<string, string>>({});
  const [lastFreeformQuery, setLastFreeformQuery] = useState<string>("");

  const handleTemplateSubmit = async (data: Record<string, string>) => {
    if (!selectedType) return;
    setLastInputData(data);
    setError(null);
    setIsLoading(true);
    try {
      const res = await callGenerateApi({
        mode: "template",
        document_type: selectedType,
        input_data: data,
      });
      setResult(res);
      setStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Generation failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeformSubmit = async (query: string) => {
    setLastFreeformQuery(query);
    setError(null);
    setIsLoading(true);
    try {
      const res = await callGenerateApi({
        mode: "freeform",
        freeform_query: query,
      });
      setResult(res);
      setStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Generation failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("input");
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/citizen/dashboard" className="hover:text-navy transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/citizen/documents" className="hover:text-navy transition-colors">
          My Documents
        </Link>
        <span>/</span>
        <span className="font-medium text-navy">Draft New</span>
      </nav>

      {/* Header */}
      <div className="mb-8 border-b border-border/70 pb-6">
        <div className="flex items-center gap-2">
          <Badge className="border-navy/20 bg-navy/5 text-navy font-semibold text-xs">
            <Sparkles className="size-3 mr-1 text-teal" aria-hidden="true" />
            Pakistan Statutory Drafting Engine
          </Badge>
        </div>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Generate Legal Document
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm max-w-2xl leading-relaxed">
          Choose a verified Pakistani legal template or describe your dispute in plain language.
          Our AI synthesizes statutory provisions to craft professional legal drafts.
        </p>
      </div>

      {step === "result" && result ? (
        <GenerationResult
          result={result}
          onBack={handleBack}
          documentType={selectedType}
          inputData={lastInputData}
          mode={mode}
          freeformQuery={lastFreeformQuery}
        />
      ) : (
        <div className="space-y-8">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive"
            >
              <TriangleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as Mode);
              setSelectedType(null);
              setError(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/90 p-1 rounded-xl h-11">
              <TabsTrigger
                value="template"
                id="tab-template"
                className="rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-xs transition-all"
              >
                <FileText className="size-3.5 mr-1.5 text-navy" aria-hidden="true" />
                Select Standard Template
              </TabsTrigger>
              <TabsTrigger
                value="freeform"
                id="tab-freeform"
                className="rounded-lg text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-xs transition-all"
              >
                <Sparkles className="size-3.5 mr-1.5 text-teal" aria-hidden="true" />
                Plain-Language Prompt (Urdu/Eng)
              </TabsTrigger>
            </TabsList>

            {/* Template Mode */}
            <TabsContent value="template" className="space-y-6 mt-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
                    Select Document Category
                  </h2>
                  <span className="text-xs text-muted-foreground">Step 1 of 2</span>
                </div>
                <DocumentTemplateGrid
                  selected={selectedType}
                  onSelect={setSelectedType}
                />
              </div>

              {selectedType && (
                <Card className="rounded-2xl border-navy/20 bg-white shadow-sm overflow-hidden animate-in fade-in-50 duration-200">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-navy/5 text-lg">
                          {selectedType === "fir"
                            ? "🚨"
                            : selectedType === "complaint"
                            ? "📋"
                            : selectedType === "legal_notice"
                            ? "📜"
                            : "📝"}
                        </span>
                        <div>
                          <h2 className="font-heading text-base font-bold text-navy">
                            Configure {getTemplateLabel(selectedType)}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Step 2 of 2 · Fill mandatory particulars
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-destructive font-medium">
                        * Required fields
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <DocumentForm
                      documentType={selectedType}
                      onSubmit={handleTemplateSubmit}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-navy/15 bg-navy/5 p-6 text-xs sm:text-sm font-medium text-navy">
                  <Loader2 className="size-5 animate-spin text-teal" aria-hidden="true" />
                  <span>
                    Searching Pakistan statutory databases & generating customized legal draft…
                  </span>
                </div>
              )}
            </TabsContent>

            {/* Free-form AI Mode */}
            <TabsContent value="freeform" className="space-y-6 mt-6">
              <Card className="rounded-2xl border-border/80 bg-white shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <DocumentQueryInput
                    onSubmit={handleFreeformSubmit}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>

              {isLoading && (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-navy/15 bg-navy/5 p-6 text-xs sm:text-sm font-medium text-navy">
                  <Loader2 className="size-5 animate-spin text-teal" aria-hidden="true" />
                  <span>
                    Interpreting factual narrative & synthesizing legal draft…
                  </span>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Legal Advisory Footer */}
          <div className="rounded-xl border border-gold/40 bg-gold-soft/50 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-navy/70" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-navy/85">
                <strong className="font-semibold text-navy">Statutory Notice: </strong>
                All instruments created by LegalEase are structured drafts.
                Prior to serving a legal notice or submitting an FIR/petition to a police station,
                consumer court, or tribunal, ensure all particulars are verified by an advocate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
