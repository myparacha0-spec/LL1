/**
 * Citation validation against actually-retrieved chunks.
 *
 * The LLM's citations are never trusted as-is: a citation is kept only when it
 * references a document that was retrieved, and a section/article reference is
 * only kept when it appears in a retrieved chunk of that document. Anything
 * else is dropped. This enforces the "model cannot cite what was not
 * retrieved" guarantee.
 */

import type { RetrievedChunk } from "@/lib/rag/retrieval";
import type { LegalCitation } from "@/lib/ai/schemas";

function normalizeRef(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface CitationLookup {
  documentIds: Set<string>;
  /** normalized section/article ΓåÆ true, per document */
  sectionsByDocument: Map<string, Set<string | null>>;
}

export function buildCitationLookup(chunks: RetrievedChunk[]): CitationLookup {
  const documentIds = new Set<string>();
  const sectionsByDocument = new Map<string, Set<string | null>>();

  for (const chunk of chunks) {
    documentIds.add(chunk.documentId);
    if (!sectionsByDocument.has(chunk.documentId)) {
      sectionsByDocument.set(chunk.documentId, new Set());
    }
    const refs = sectionsByDocument.get(chunk.documentId)!;
    refs.add(normalizeRef(chunk.sectionNumber));
    refs.add(normalizeRef(chunk.articleNumber));
  }

  return { documentIds, sectionsByDocument };
}

export function validateCitations(
  citations: LegalCitation[],
  lookup: CitationLookup
): LegalCitation[] {
  const result: LegalCitation[] = [];
  const seen = new Set<string>();

  for (const citation of citations) {
    if (!citation.document_id || !lookup.documentIds.has(citation.document_id)) {
      continue; // cited a document that was never retrieved ΓåÆ reject
    }

    const sectionRef = normalizeRef(citation.section);
    const articleRef = normalizeRef(citation.article);
    const docRefs = lookup.sectionsByDocument.get(citation.document_id) ?? new Set();

    // Keep a section/article reference only if it was actually retrieved.
    const section = sectionRef && docRefs.has(sectionRef) ? sectionRef : null;
    const article = articleRef ? (docRefs.has(articleRef) ? articleRef : null) : null;

    const key = `${citation.document_id}|${section ?? ""}|${article ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      document_id: citation.document_id,
      title: citation.title,
      section: section ?? null,
      article: article ?? null,
      page: citation.page ?? null,
    });
  }

  return result;
}

/** Pick the retrieved chunk that best matches a validated citation. */
function chunkForCitation(
  chunks: RetrievedChunk[],
  citation: LegalCitation
): RetrievedChunk | null {
  const section = citation.section?.toLowerCase() ?? null;
  const article = citation.article?.toLowerCase() ?? null;
  return (
    chunks.find(
      (c) =>
        c.documentId === citation.document_id &&
        section &&
        ((c.sectionNumber?.toLowerCase() ?? null) === section ||
          (c.articleNumber?.toLowerCase() ?? null) === section)
    ) ??
    chunks.find(
      (c) =>
        c.documentId === citation.document_id &&
        article &&
        c.articleNumber?.toLowerCase() === article
    ) ??
    chunks.find((c) => c.documentId === citation.document_id) ??
    null
  );
}

/**
 * Build the source records persisted with an assistant message from the
 * retrieved chunks + the validated citations. Excerpts come from the retrieved
 * chunk content (never from the LLM).
 */
export function buildSources(
  chunks: RetrievedChunk[],
  citations: LegalCitation[]
): Array<Record<string, unknown>> {
  const selected =
    citations.length > 0
      ? citations
          .map((citation) => chunkForCitation(chunks, citation))
          .filter((chunk): chunk is RetrievedChunk => chunk !== null)
      : chunks;

  const seen = new Set<string>();
  const sources: Array<Record<string, unknown>> = [];
  for (const chunk of selected.slice(0, 8)) {
    if (seen.has(chunk.chunkId)) continue;
    seen.add(chunk.chunkId);
    sources.push({
      chunk_id: chunk.chunkId,
      document_id: chunk.documentId,
      title: chunk.documentTitle,
      section_number: chunk.sectionNumber,
      article_number: chunk.articleNumber,
      section_title: chunk.sectionTitle,
      page_number: chunk.pageNumber,
      category: chunk.category,
      jurisdiction_level: chunk.jurisdictionLevel,
      province: chunk.province,
      country: "Pakistan",
      verification_status: chunk.verificationStatus ?? "verified",
      official_source_url: chunk.officialSourceUrl,
      excerpt: chunk.content.slice(0, 700),
      similarity: Number(chunk.similarity.toFixed(3)),
    });
  }

  return sources;
}
