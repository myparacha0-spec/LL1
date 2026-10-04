/**
 * POST /api/citizen/documents/generate
 *
 * LE-305 Document Assistance — AI generation endpoint.
 * Accepts either a structured template input or a free-form natural language request.
 * Uses Zamin's RAG retrieval to ground the generation in Pakistan legal context.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRequestSchema, getStructuredSchema } from "@/lib/citizen/documents/document-schemas";
import { generateFromFreeform, generateFromTemplate, DocumentGenerationError } from "@/lib/citizen/documents/document-generator";
import type { DocumentType } from "@/lib/citizen/documents/document-types";

export async function POST(request: NextRequest) {
  // 1 — authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: "Unauthorized. Please sign in to generate documents." },
      { status: 401 }
    );
  }

  // 2 — parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  // 3 — validate with zod
  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid request.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const req = parsed.data;

  try {
    // 4a — free-form mode
    if (req.mode === "freeform") {
      const result = await generateFromFreeform(supabase, req.freeform_query!);
      return Response.json({ success: true, data: result });
    }

    // 4b — template mode: validate structured input against the specific doc schema
    const documentType = req.document_type as DocumentType;
    const structuredSchema = getStructuredSchema(documentType);
    const inputParsed = structuredSchema.safeParse(req.input_data);

    if (!inputParsed.success) {
      return Response.json(
        {
          error: "Form validation failed.",
          details: inputParsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const result = await generateFromTemplate(
      supabase,
      documentType,
      inputParsed.data as Record<string, unknown>
    );

    return Response.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof DocumentGenerationError) {
      const status = err.kind === "auth" ? 401 : err.kind === "config" ? 503 : 500;
      return Response.json(
        { error: err.message, kind: err.kind },
        { status }
      );
    }
    console.error("[/api/citizen/documents/generate]", err);
    return Response.json(
      { error: "An unexpected error occurred during generation." },
      { status: 500 }
    );
  }
}
