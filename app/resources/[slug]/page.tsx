import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import {
  getPublishedResourceBySlug,
  getRelatedPublishedResources,
} from "@/lib/data/resources";

interface ResourceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ResourceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) {
    return {
      title: "Resource Not Found | LegalEase",
    };
  }

  return {
    title: `${resource.title} | LegalEase`,
    description: resource.summary,
  };
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps) {
  const { slug } = await params;

  const resource = await getPublishedResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  const relatedResources = await getRelatedPublishedResources(resource);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F2747] transition hover:text-[#C59A3D]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Legal Resources
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {resource.category && (
              <span className="rounded-full bg-[#0F2747]/10 px-3 py-1 text-xs font-semibold text-[#0F2747]">
                {resource.category.name}
              </span>
            )}

            <span className="rounded-full bg-[#C59A3D]/15 px-3 py-1 text-xs font-semibold text-[#8a691f]">
              {resource.jurisdiction}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl lg:text-5xl">
            {resource.title}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {resource.summary}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2747]/10">
                <FileText className="h-5 w-5 text-[#0F2747]" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Law
                </p>
                <p className="mt-1 font-semibold text-[#172033]">
                  {resource.law_name || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59A3D]/15">
                <FileText className="h-5 w-5 text-[#8a691f]" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Section / Reference
                </p>
                <p className="mt-1 font-semibold text-[#172033]">
                  {resource.section_reference || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <article className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold text-[#172033]">
            Legal Information
          </h2>

          <div className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">
            {resource.content}
          </div>

          {resource.keywords?.length > 0 && (
            <div className="mt-10 border-t border-slate-200 pt-7">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Keywords
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {resource.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F8B8D]/10">
              <MapPin className="h-5 w-5 text-[#0F8B8D]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#172033]">
                Source & Jurisdiction
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Source:{" "}
                <span className="font-medium text-slate-800">
                  {resource.source_name}
                </span>
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Jurisdiction:{" "}
                <span className="font-medium text-slate-800">
                  {resource.jurisdiction}
                </span>
              </p>

              {resource.source_url && (
                <a
                  href={resource.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0F2747] hover:text-[#C59A3D]"
                >
                  Open official source
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm leading-6 text-amber-900">
            <strong>Important:</strong> This information is provided for
            general legal awareness and does not replace professional legal
            advice. Laws and procedures can change. Verify the current law
            from the official source before taking legal action.
          </p>
        </section>

        {relatedResources.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-[#172033]">
              Related Resources
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {relatedResources.map((related) => (
                <Link
                  key={related.id}
                  href={`/resources/${related.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#C59A3D]/50 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#0F8B8D]">
                    {related.category?.name || "Legal Resource"}
                  </span>

                  <h3 className="mt-3 line-clamp-2 text-lg font-bold text-[#172033] group-hover:text-[#0F2747]">
                    {related.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {related.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}