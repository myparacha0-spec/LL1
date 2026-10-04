/**
 * /api/citizen/documents
 *
 * GET  — List the authenticated user's saved documents
 * POST — Save a generated document to public.citizen_documents
 * PATCH — Update a document (title, content, status)
 * DELETE — Delete a document
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  saveDocumentSchema,
  updateDocumentSchema,
} from "@/lib/citizen/documents/document-schemas";

// ---------------------------------------------------------------------------
// GET — list user's documents
// ---------------------------------------------------------------------------
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("citizen_documents")
    .select("id, title, document_type, template_id, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[GET /api/citizen/documents]", error);
    return Response.json(
      { error: "Failed to fetch documents." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, data: data ?? [] });
}

// ---------------------------------------------------------------------------
// POST — save a generated document
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = saveDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Validation failed.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const doc = parsed.data;

  const { data, error } = await supabase
    .from("citizen_documents")
    .insert({
      user_id: user.id, // always server-side — never trust client
      template_id: doc.template_id,
      title: doc.title,
      document_type: doc.document_type,
      input_data: doc.input_data,
      generated_content: doc.generated_content,
      status: doc.status,
    })
    .select("id, title, document_type, status, created_at")
    .single();

  if (error) {
    console.error("[POST /api/citizen/documents]", error);
    return Response.json({ error: "Failed to save document." }, { status: 500 });
  }

  return Response.json({ success: true, data }, { status: 201 });
}

// ---------------------------------------------------------------------------
// PATCH — update title / content / status
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Document ID is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return Response.json({ error: "No fields to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("citizen_documents")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id) // RLS-safe but extra check
    .select("id, title, status, updated_at")
    .single();

  if (error) {
    console.error("[PATCH /api/citizen/documents]", error);
    return Response.json({ error: "Failed to update document." }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Document not found or access denied." }, { status: 404 });
  }

  return Response.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE — delete a document
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Document ID is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("citizen_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[DELETE /api/citizen/documents]", error);
    return Response.json({ error: "Failed to delete document." }, { status: 500 });
  }

  return Response.json({ success: true });
}
