/**
 * /api/citizen/documents/[id]
 *
 * GET    — Fetch a single document by ID (ownership enforced)
 * PATCH  — Update a document by ID
 * DELETE — Delete a document by ID
 *
 * These dynamic-route endpoints provide a cleaner REST interface
 * alongside the query-param-based operations in the parent route.ts.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateDocumentSchema } from "@/lib/citizen/documents/document-schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// GET — fetch single document
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
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
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/citizen/documents/[id]]", error);
    return Response.json(
      { error: "Failed to fetch document." },
      { status: 500 }
    );
  }

  if (!data) {
    return Response.json(
      { error: "Document not found or access denied." },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// PATCH — update a document
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
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
    .eq("user_id", user.id)
    .select("id, title, status, updated_at")
    .single();

  if (error) {
    console.error("[PATCH /api/citizen/documents/[id]]", error);
    return Response.json(
      { error: "Failed to update document." },
      { status: 500 }
    );
  }

  if (!data) {
    return Response.json(
      { error: "Document not found or access denied." },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE — delete a document
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("citizen_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[DELETE /api/citizen/documents/[id]]", error);
    return Response.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
