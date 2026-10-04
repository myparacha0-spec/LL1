/**
 * /citizen/documents
 *
 * LE-305 — My Documents list page (Server Component)
 *
 * Lists the authenticated user's saved citizen_documents.
 * Redirects to login if unauthenticated.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Plus,
  Clock,
  ArrowRight,
  AlertCircle,
  FileCheck2,
  FileClock,
  ShieldCheck,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CitizenDocumentRow } from "@/lib/citizen/documents/document-schemas";
import { DocumentsClientActions } from "@/app/citizen/documents/documents-client";

export const metadata: Metadata = {
  title: "My Legal Documents — LegalEase Citizen Portal",
  description:
    "Manage your AI-generated legal documents — FIRs, complaints, notices, and applications.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function docTypeIcon(type: string): string {
  switch (type) {
    case "fir":
      return "🚨";
    case "complaint":
      return "📋";
    case "legal_notice":
      return "📜";
    case "application":
      return "📝";
    default:
      return "📄";
  }
}

function docTypeLabel(type: string): string {
  switch (type) {
    case "fir":
      return "FIR Draft";
    case "complaint":
      return "Complaint";
    case "legal_notice":
      return "Legal Notice";
    case "application":
      return "Formal Application";
    default:
      return type;
  }
}

function docTypeBadgeClass(type: string): string {
  switch (type) {
    case "fir":
      return "border-red-200 bg-red-50 text-red-700";
    case "complaint":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "legal_notice":
      return "border-gold/40 bg-gold-soft text-navy";
    case "application":
      return "border-teal/30 bg-teal-soft text-teal";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/citizen/documents");
  }

  const { data: documents, error } = await supabase
    .from("citizen_documents")
    .select("id, title, document_type, template_id, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .returns<CitizenDocumentRow[]>();

  const totalCount = documents?.length ?? 0;
  const completeCount = documents?.filter((d) => d.status === "complete").length ?? 0;
  const draftCount = totalCount - completeCount;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 bg-navy/5 px-2.5 py-0.5 text-xs font-semibold text-navy">
              <FileText className="size-3 text-teal" aria-hidden="true" />
              Document Assistance
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            My Legal Documents
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Review, edit, export, and manage your AI-drafted legal documents under Pakistan law.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            id="create-document-btn"
            className="bg-navy font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            <Link href="/citizen/documents/create">
              <Plus className="size-4 mr-1.5" aria-hidden="true" />
              Draft New Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Counter Bar (when documents exist) */}
      {documents && documents.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Documents
            </p>
            <p className="mt-1 text-xl font-bold text-navy">{totalCount}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-1 text-[11px] font-medium text-teal uppercase tracking-wider">
              <FileCheck2 className="size-3" aria-hidden="true" />
              <span>Complete</span>
            </div>
            <p className="mt-1 text-xl font-bold text-navy">{completeCount}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <FileClock className="size-3" aria-hidden="true" />
              <span>Drafts</span>
            </div>
            <p className="mt-1 text-xl font-bold text-navy">{draftCount}</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Failed to load legal documents</p>
            <p className="text-xs text-destructive/80 mt-0.5">
              Please check your network connection and refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && (!documents || documents.length === 0) && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-white px-6 py-16 text-center shadow-xs">
          <div className="grid size-16 place-items-center rounded-2xl bg-slate-50 text-navy ring-1 ring-slate-200/60 shadow-xs">
            <FileText className="size-8 text-navy/70" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-bold text-navy sm:text-xl">
            No legal documents drafted yet
          </h2>
          <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Generate your first Pakistan-statutory legal draft. Choose from FIR drafts,
            rental notices, consumer complaints, or plain-language requests.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="bg-navy font-semibold text-white shadow-sm hover:bg-navy-light"
            >
              <Link href="/citizen/documents/create">
                <Plus className="size-4 mr-1.5" aria-hidden="true" />
                Draft First Document
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resources">
                <Search className="size-3.5 mr-1.5 text-muted-foreground" aria-hidden="true" />
                Browse Legal Templates
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Document list */}
      {!error && documents && documents.length > 0 && (
        <div className="mt-6 space-y-3">
          {documents.map((doc) => {
            const rawType = doc.document_type ?? doc.template_id;
            return (
              <Card
                key={doc.id}
                className="group relative overflow-hidden border-border/80 bg-white transition-all duration-150 hover:border-navy/30 hover:shadow-md"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-xl ring-1 ring-slate-200/60">
                        {docTypeIcon(rawType)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-heading text-base font-bold text-navy truncate">
                            {doc.title}
                          </h2>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${docTypeBadgeClass(
                              rawType
                            )}`}
                          >
                            {docTypeLabel(rawType)}
                          </span>
                          <Badge
                            variant={doc.status === "complete" ? "default" : "secondary"}
                            className="text-[10px] py-0.5"
                          >
                            {doc.status === "complete" ? "Ready" : "Draft"}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3 text-slate-400" aria-hidden="true" />
                            {formatDate(doc.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <DocumentsClientActions docId={doc.id} />
                      <Button
                        asChild
                        size="sm"
                        id={`open-doc-${doc.id}`}
                        className="bg-navy font-semibold text-white shadow-xs hover:bg-navy-light text-xs"
                      >
                        <Link href={`/citizen/documents/${doc.id}`}>
                          <span>Open</span>
                          <ArrowRight className="size-3.5 ml-1" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info advisory footer */}
      <div className="mt-10 rounded-xl border border-gold/30 bg-gold-soft/50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-4 shrink-0 mt-0.5 text-navy/70" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-navy/85">
            <strong className="font-semibold text-navy">LegalEase Document Policy: </strong>
            Documents created here are stored securely under your authenticated account.
            AI-assisted drafts provide statutory structures under Pakistani law (CrPC, PPC, Consumer Protection)
            and should be vetted by an advocate prior to formal filing.
          </p>
        </div>
      </div>
    </div>
  );
}
