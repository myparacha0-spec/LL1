/**
 * LE-305 Document Assistance — AI generation prompts
 *
 * Builds LLM prompts for Pakistan-specific legal document generation.
 * The model must only use retrieved RAG context for legal references.
 */

import type { RetrievedChunk } from "@/lib/rag/retrieval";
import type { ChatMessage } from "@/lib/ai/openrouter";
import type { DocumentType } from "./document-types";

// ---------------------------------------------------------------------------
// System prompt — strict grounding rules
// ---------------------------------------------------------------------------

export function buildDocumentSystemPrompt(): string {
  return [
    "You are LegalEase Document Assistant, an AI that drafts Pakistan-specific legal documents using ONLY the verified legal context supplied to you.",
    "",
    "HARD RULES:",
    "1. Do NOT invent law sections, PPC sections, CrPC sections, CPLA provisions, regulatory rules, or any legal citation.",
    "2. Do NOT fabricate case references, court names, or legal procedures.",
    "3. Only cite laws or sections that explicitly appear in the RETRIEVED CONTEXT provided.",
    "4. If no relevant legal context is retrieved, write a factually correct document template WITHOUT legal citations.",
    "5. Use formal Urdu legal vocabulary where applicable (e.g., Mudda'i, Muddaalayh, Arzi, etc.) but keep sections in English unless specified.",
    "6. Flag when legal professional review is required.",
    "7. Identify any missing information that prevents a complete document.",
    "8. Do NOT add fictional details — only use information provided by the user.",
    "9. Generate documents appropriate for Pakistan legal practice (Karachi / Sindh jurisdiction by default).",
    "10. Return ONLY a valid JSON object — no markdown fences, no commentary outside the JSON.",
    "",
    "Output EXACTLY this JSON schema:",
    JSON.stringify({
      document_type: "detected or confirmed document type slug",
      title: "Short descriptive title for this document",
      generated_content: "The full generated document text",
      is_ready: true,
      missing_fields: ["list of fields that are missing or insufficient"],
      questions: ["questions to ask the user for missing information"],
      citations: [
        {
          title: "Law title from retrieved context",
          section: "section number",
          article: "article number",
        },
      ],
      warnings: ["Important warnings or caveats"],
      disclaimer:
        "This document is an AI-assisted draft generated for informational purposes only. It should be reviewed by a qualified lawyer before submission to any court, authority, or third party.",
      rag_sources: [
        {
          title: "Document title from context",
          category: "category",
          jurisdiction_level: "jurisdiction level",
        },
      ],
    }),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Context section builder — reuses Zamin's chunk format
// ---------------------------------------------------------------------------

export function buildDocumentContextSection(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No specific legal context was retrieved. Generate a standard document template without citing specific laws.";
  }
  return chunks
    .map((chunk, i) => {
      const parts = [
        `[${i + 1}] DOCUMENT: ${chunk.documentTitle}`,
        chunk.versionLabel ? `  version: ${chunk.versionLabel}` : null,
        chunk.sectionNumber ? `  section: ${chunk.sectionNumber}` : null,
        chunk.articleNumber ? `  article: ${chunk.articleNumber}` : null,
        chunk.sectionTitle ? `  heading: ${chunk.sectionTitle}` : null,
        chunk.jurisdictionLevel
          ? `  jurisdiction: ${chunk.jurisdictionLevel}${chunk.province ? ` (${chunk.province})` : ""}`
          : null,
        `  CONTENT: ${chunk.content}`,
      ];
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Free-form query prompt — AI understands request + identifies doc type
// ---------------------------------------------------------------------------

export function buildFreeformGenerationMessages(input: {
  freeformQuery: string;
  chunks: RetrievedChunk[];
}): ChatMessage[] {
  const { freeformQuery, chunks } = input;

  const contextSection = buildDocumentContextSection(chunks);

  const userMessage = [
    "RETRIEVED LEGAL CONTEXT (Pakistan — use only this for legal citations):",
    "---",
    contextSection,
    "---",
    "",
    `USER REQUEST: ${freeformQuery}`,
    "",
    "INSTRUCTIONS:",
    "1. Understand what type of legal document the user needs (FIR, Complaint, Legal Notice, or Application).",
    "2. Extract all relevant information from the user's request.",
    "3. If the request lacks sufficient information to generate a complete document, set is_ready=false and list specific questions in 'questions' array.",
    "4. If sufficient information exists, generate the full document in 'generated_content'.",
    "5. Use ONLY the retrieved legal context for any legal references.",
    "6. Set document_type to one of: 'fir', 'complaint', 'legal_notice', 'application'.",
    "",
    "Return the JSON object described by the system instructions.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: buildDocumentSystemPrompt() },
    { role: "user", content: userMessage },
  ];
}

// ---------------------------------------------------------------------------
// Structured template prompt — user has filled fields
// ---------------------------------------------------------------------------

export function buildTemplateGenerationMessages(input: {
  documentType: DocumentType;
  inputData: Record<string, unknown>;
  chunks: RetrievedChunk[];
}): ChatMessage[] {
  const { documentType, inputData, chunks } = input;

  const contextSection = buildDocumentContextSection(chunks);

  const formattedInput = Object.entries(inputData)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `  ${k}: ${String(v)}`)
    .join("\n");

  const docTypeLabel =
    documentType === "fir"
      ? "First Information Report (FIR)"
      : documentType === "complaint"
        ? "Formal Complaint"
        : documentType === "legal_notice"
          ? "Legal Notice"
          : "Application";

  const userMessage = [
    "RETRIEVED LEGAL CONTEXT (Pakistan — use only this for legal citations):",
    "---",
    contextSection,
    "---",
    "",
    `DOCUMENT TYPE: ${docTypeLabel}`,
    "",
    "USER-PROVIDED INFORMATION:",
    formattedInput,
    "",
    "INSTRUCTIONS:",
    `1. Generate a complete, formal ${docTypeLabel} using the information provided above.`,
    "2. Use proper Pakistan legal document format and language.",
    "3. Only include legal citations from the RETRIEVED LEGAL CONTEXT above.",
    "4. List any required information that is missing in 'missing_fields'.",
    "5. If critical information is missing, set is_ready=false and provide questions.",
    "6. The document must be ready for submission after lawyer review.",
    "7. Include proper date, reference numbers placeholders (e.g. [DATE]) where user did not provide them.",
    "",
    "Return the JSON object described by the system instructions.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: buildDocumentSystemPrompt() },
    { role: "user", content: userMessage },
  ];
}

// ---------------------------------------------------------------------------
// RAG query builder — what to retrieve for each document type
// ---------------------------------------------------------------------------

export function buildRagQueryForDocumentType(
  documentType: DocumentType,
  context: Record<string, unknown>
): string {
  const offence = String(context.offence_type ?? "");
  const subject = String(
    context.complaint_subject ?? context.notice_subject ?? context.application_subject ?? ""
  );

  switch (documentType) {
    case "fir":
      return `FIR filing procedure Pakistan ${offence} police complaint CrPC Pakistan Penal Code`;
    case "complaint":
      return `formal complaint Pakistan consumer rights labour court ${subject} regulatory authority`;
    case "legal_notice":
      return `legal notice Pakistan ${subject} recovery demand notice civil law`;
    case "application":
      return `formal application Pakistan government institution ${subject}`;
    default:
      return "Pakistan legal document procedure";
  }
}

export function buildRagQueryForFreeform(query: string): string {
  // Pass the user's query directly — it's better for semantic retrieval
  return query;
}
