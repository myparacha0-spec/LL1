"use client";

/**
 * Document view + edit client component.
 * Loaded by the /citizen/documents/[id] server page.
 *
 * Key behaviors:
 *  - Edit title + content inline
 *  - Save → updates DB → refreshes server data → baseline resets
 *  - Export latest content (edited or saved) as real .txt file
 *  - Delete with confirmation
 *  - Loading / error / success feedback
 */

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Save,
  PenLine,
  X,
  Trash2,
  CheckCircle2,
  TriangleAlert,
  Info,
  Loader2,
  Clock,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CitizenDocumentRow } from "@/lib/citizen/documents/document-schemas";

function docTypeLabel(type: string): string {
  switch (type) {
    case "fir": return "FIR";
    case "complaint": return "Complaint";
    case "legal_notice": return "Legal Notice";
    case "application": return "Application";
    default: return type;
  }
}

function docTypeIcon(type: string): string {
  switch (type) {
    case "fir": return "🚨";
    case "complaint": return "📋";
    case "legal_notice": return "📜";
    case "application": return "📝";
    default: return "📄";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentViewClient({ doc }: { doc: CitizenDocumentRow }) {
  const router = useRouter();

  // Editable state
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.generated_content);

  // Track the "last saved" baseline so hasChanges works correctly after save
  const [savedTitle, setSavedTitle] = useState(doc.title);
  const [savedContent, setSavedContent] = useState(doc.generated_content);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasChanges = title !== savedTitle || content !== savedContent;

  // ----- Save -----
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    if (!content.trim()) {
      setError("Document content cannot be empty.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const res = await fetch(`/api/citizen/documents?id=${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          generated_content: content,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Update failed.");

      // Update baseline so hasChanges resets
      setSavedTitle(title.trim());
      setSavedContent(content);
      setSaveSuccess(true);
      setIsEditing(false);

      // Refresh server component data so next reload is in sync
      router.refresh();

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }, [doc.id, title, content, router]);

  // ----- Delete -----
  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/citizen/documents?id=${doc.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Delete failed.");
      router.push("/citizen/documents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setIsDeleting(false);
    }
  }, [doc.id, router]);

  // ----- Export real .txt -----
  const handleExport = useCallback(() => {
    try {
      const exportContent = content || "";
      if (!exportContent.trim()) {
        setError("Nothing to export — document content is empty.");
        return;
      }
      const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(title || "document").replace(/[^a-z0-9 ]/gi, "").replace(/\s+/g, "_").toLowerCase()}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    }
  }, [content, title]);

  // ----- Edit toggle -----
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {/* Back */}
      <Link
        href="/citizen/documents"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        My Documents
      </Link>

      {/* Header actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              {docTypeIcon(doc.document_type ?? doc.template_id)}
            </span>
            <Badge variant="secondary" className="text-xs">
              {docTypeLabel(doc.document_type ?? doc.template_id)}
            </Badge>
            <Badge
              variant={doc.status === "complete" ? "default" : "secondary"}
              className="text-xs"
            >
              {doc.status === "complete" ? "Complete" : "Draft"}
            </Badge>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            Last updated: {formatDate(doc.updated_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            id="export-doc"
            onClick={handleExport}
            className="gap-1.5"
            aria-label="Export document as text file"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export .txt
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              id="save-doc-changes"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-3.5" aria-hidden="true" />
              )}
              Save changes
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            id="delete-doc"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            aria-label="Delete document"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Feedback */}
      {saveSuccess && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-teal/30 bg-teal-soft px-4 py-2.5 text-sm text-teal"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          Changes saved successfully.
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Title */}
      <div className="mb-5 space-y-1.5">
        <Label htmlFor="view-title" className="text-sm font-medium">
          Document title
        </Label>
        <Input
          id="view-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-heading font-semibold text-navy text-lg"
          placeholder="Enter document title"
          aria-required="true"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="view-content" className="text-sm font-medium">
            Document content
          </Label>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              id="edit-doc-btn"
              onClick={startEditing}
              className="gap-1.5 text-xs h-7"
            >
              <PenLine className="size-3" aria-hidden="true" />
              Edit
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopEditing}
              className="gap-1.5 text-xs h-7 text-muted-foreground"
            >
              <X className="size-3" aria-hidden="true" />
              Done editing
            </Button>
          )}
        </div>

        {isEditing ? (
          <Textarea
            ref={textareaRef}
            id="view-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={22}
            className="font-mono text-sm leading-relaxed resize-y"
            aria-label="Edit document content"
          />
        ) : (
          <div
            id="view-content"
            className="min-h-[300px] rounded-lg border border-border bg-white p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground"
            aria-label="Document content preview"
          >
            {content || (
              <span className="text-muted-foreground italic">
                No content. Click Edit to add content.
              </span>
            )}
          </div>
        )}
      </div>

      {/* AI draft warning */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-navy/10 bg-navy/5 px-4 py-2.5">
        <FileText className="size-4 shrink-0 text-navy/60" aria-hidden="true" />
        <p className="text-xs text-navy/70">
          <strong className="font-semibold">AI-Assisted Draft</strong> — This
          document was generated using AI and verified legal context. Review and
          edit before use.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 rounded-lg border border-gold/30 bg-gold-soft px-4 py-3">
        <div className="flex items-start gap-2">
          <Info className="size-4 shrink-0 mt-0.5 text-gold" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-navy/80">
            <strong className="font-semibold">Legal Disclaimer: </strong>
            This document is an AI-assisted draft for informational purposes
            only. It should be reviewed by a qualified lawyer before submission
            to any court, authority, or third party.
          </p>
        </div>
      </div>
    </div>
  );
}
