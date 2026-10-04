/**
 * LE-305 Document Assistance — Document generator
 *
 * Server-only. Orchestrates RAG retrieval + LLM generation for Pakistan
 * legal documents. Uses Zamin's retrieval and openrouter implementations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { chatCompletion, OpenRouterError } from "@/lib/ai/openrouter";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { getAiConfig } from "@/lib/ai/config";
import { retrieveLegalChunks, dedupeChunks } from "@/lib/rag/retrieval";
import type { DocumentType } from "./document-types";
import {
  buildFreeformGenerationMessages,
  buildTemplateGenerationMessages,
  buildRagQueryForDocumentType,
  buildRagQueryForFreeform,
} from "./document-prompts";
import { generationResponseSchema } from "./document-schemas";
import type { GenerationResponse } from "./document-schemas";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class DocumentGenerationError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "config"
      | "validation"
      | "retrieval"
      | "llm"
      | "parse"
      | "auth" = "llm"
  ) {
    super(message);
    this.name = "DocumentGenerationError";
  }
}

// ---------------------------------------------------------------------------
// JSON parsing — same approach as Zamin's legal-rag.ts
// ---------------------------------------------------------------------------

function parseLlmJson(raw: string): Record<string, unknown> {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new DocumentGenerationError(
      "The model did not return a valid JSON object.",
      "parse"
    );
  }
  return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as Record<
    string,
    unknown
  >;
}

// ---------------------------------------------------------------------------
// Generate — freeform mode
// ---------------------------------------------------------------------------

export async function generateFromFreeform(
  supabase: SupabaseClient,
  query: string
): Promise<GenerationResponse> {
  const cfg = getAiConfig();

  if (!cfg.embeddingApiKey) {
    throw new DocumentGenerationError(
      "Embedding API key is not configured (set OPENROUTER_API_KEY in environment).",
      "config"
    );
  }
  if (!cfg.openRouterApiKey) {
    throw new DocumentGenerationError(
      "OpenRouter API key is not configured (set OPENROUTER_API_KEY in environment).",
      "config"
    );
  }

  // 1 — embed the user's query
  const ragQuery = buildRagQueryForFreeform(query);
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(ragQuery);
  } catch (err) {
    // RAG failure is non-fatal — generate without context
    console.warn("[DocumentGenerator] Embedding failed, continuing without RAG:", err);
    queryEmbedding = [];
  }

  // 2 — retrieve legal context
  let chunks: Awaited<ReturnType<typeof retrieveLegalChunks>> = [];
  if (queryEmbedding.length > 0) {
    try {
      const retrieved = await retrieveLegalChunks(supabase, {
        queryEmbedding,
        matchCount: cfg.maxRetrievedChunks,
        similarityThreshold: cfg.similarityThreshold,
        category: null,
        jurisdictionLevel: null,
        province: null,
      });
      chunks = dedupeChunks(retrieved, 4);
    } catch (err) {
      console.warn("[DocumentGenerator] RAG retrieval failed, continuing without context:", err);
    }
  }

  // 3 — build messages + call LLM
  const messages = buildFreeformGenerationMessages({ freeformQuery: query, chunks });

  let llmText: string;
  try {
    const res = await chatCompletion(messages, {
      jsonObject: true,
      maxTokens: 2000,
      temperature: 0.2,
    });
    llmText = res.content;
  } catch (err) {
    if (err instanceof OpenRouterError) {
      throw new DocumentGenerationError(err.message, err.kind === "config" ? "config" : "llm");
    }
    throw err;
  }

  // 4 — parse + validate
  let parsed: Record<string, unknown>;
  try {
    parsed = parseLlmJson(llmText);
  } catch (err) {
    throw err instanceof DocumentGenerationError
      ? err
      : new DocumentGenerationError(
          `Could not parse AI response: ${(err as Error).message}`,
          "parse"
        );
  }

  // 5 — add rag_sources from retrieved chunks (server-authoritative)
  parsed.rag_sources = chunks.map((c) => ({
    title: c.documentTitle,
    category: c.category,
    jurisdiction_level: c.jurisdictionLevel,
  }));

  const result = generationResponseSchema.safeParse(parsed);
  if (!result.success) {
    // Best-effort: return what we have with the raw content
    return {
      document_type: String(parsed.document_type ?? "unknown"),
      title: String(parsed.title ?? "Generated Document"),
      generated_content: String(parsed.generated_content ?? llmText),
      is_ready: false,
      missing_fields: [],
      questions: [],
      citations: [],
      warnings: ["AI response did not match expected format. Please review carefully."],
      disclaimer:
        "This document is an AI-assisted draft generated for informational purposes only. It should be reviewed by a qualified lawyer before submission to any court, authority, or third party.",
      rag_sources: parsed.rag_sources as GenerationResponse["rag_sources"],
    };
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Generate — template mode
// ---------------------------------------------------------------------------

export async function generateFromTemplate(
  supabase: SupabaseClient,
  documentType: DocumentType,
  inputData: Record<string, unknown>
): Promise<GenerationResponse> {
  const cfg = getAiConfig();

  if (!cfg.openRouterApiKey) {
    throw new DocumentGenerationError(
      "OpenRouter API key is not configured (set OPENROUTER_API_KEY in environment).",
      "config"
    );
  }

  // 1 — build RAG query from document type + user data
  const ragQuery = buildRagQueryForDocumentType(documentType, inputData);

  let queryEmbedding: number[] = [];
  if (cfg.embeddingApiKey) {
    try {
      queryEmbedding = await generateEmbedding(ragQuery);
    } catch (err) {
      console.warn("[DocumentGenerator] Embedding failed:", err);
    }
  }

  // 2 — retrieve legal context
  let chunks: Awaited<ReturnType<typeof retrieveLegalChunks>> = [];
  if (queryEmbedding.length > 0) {
    try {
      const retrieved = await retrieveLegalChunks(supabase, {
        queryEmbedding,
        matchCount: cfg.maxRetrievedChunks,
        similarityThreshold: cfg.similarityThreshold,
        category: null,
        jurisdictionLevel: null,
        province: null,
      });
      chunks = dedupeChunks(retrieved, 4);
    } catch (err) {
      console.warn("[DocumentGenerator] RAG retrieval failed:", err);
    }
  }

  // 3 — build messages
  const messages = buildTemplateGenerationMessages({
    documentType,
    inputData,
    chunks,
  });

  // 4 — call LLM
  let llmText: string;
  try {
    const res = await chatCompletion(messages, {
      jsonObject: true,
      maxTokens: 2500,
      temperature: 0.15,
    });
    llmText = res.content;
  } catch (err) {
    if (err instanceof OpenRouterError) {
      throw new DocumentGenerationError(err.message, err.kind === "config" ? "config" : "llm");
    }
    throw err;
  }

  // 5 — parse
  let parsed: Record<string, unknown>;
  try {
    parsed = parseLlmJson(llmText);
  } catch (err) {
    throw err instanceof DocumentGenerationError
      ? err
      : new DocumentGenerationError(
          `Could not parse AI response: ${(err as Error).message}`,
          "parse"
        );
  }

  // Server-authoritative RAG sources
  parsed.rag_sources = chunks.map((c) => ({
    title: c.documentTitle,
    category: c.category,
    jurisdiction_level: c.jurisdictionLevel,
  }));

  // Ensure document_type matches what was requested
  if (!parsed.document_type) {
    parsed.document_type = documentType;
  }

  const result = generationResponseSchema.safeParse(parsed);
  if (!result.success) {
    return {
      document_type: documentType,
      title: String(parsed.title ?? "Generated Document"),
      generated_content: String(parsed.generated_content ?? llmText),
      is_ready: false,
      missing_fields: [],
      questions: [],
      citations: [],
      warnings: ["AI response format mismatch. Please review carefully."],
      disclaimer:
        "This document is an AI-assisted draft generated for informational purposes only. It should be reviewed by a qualified lawyer before submission to any court, authority, or third party.",
      rag_sources: (parsed.rag_sources as GenerationResponse["rag_sources"]) ?? [],
    };
  }

  return result.data;
}
