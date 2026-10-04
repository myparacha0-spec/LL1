import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CitizenDocumentRow } from "@/lib/citizen/documents/document-schemas";
import { DocumentViewClient } from "./document-view-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("citizen_documents")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  return {
    title: data?.title ?? "Document",
    description: "View and edit your AI-generated legal document.",
  };
}

export default async function DocumentViewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/citizen/documents");
  }

  const { data: doc, error } = await supabase
    .from("citizen_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !doc) {
    notFound();
  }

  return <DocumentViewClient doc={doc as CitizenDocumentRow} />;
}