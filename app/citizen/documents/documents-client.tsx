"use client";

/**
 * Client-side delete action for the documents list.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentsClientActionsProps {
  docId: string;
}

export function DocumentsClientActions({ docId }: DocumentsClientActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (
      !confirm("Are you sure you want to delete this document? This cannot be undone.")
    ) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/citizen/documents?id=${docId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Delete failed.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant="ghost"
        size="sm"
        id={`delete-doc-${docId}`}
        onClick={handleDelete}
        disabled={isDeleting}
        className="size-8 p-0 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Delete document"
        aria-label="Delete document"
      >
        {isDeleting ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-3.5" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
