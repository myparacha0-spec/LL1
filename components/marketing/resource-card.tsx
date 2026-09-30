import Link from "next/link";
import { ArrowRight, Clock3, Scale } from "lucide-react";

import type { LegalResource } from "@/lib/data/resources";

interface ResourceCardProps {
  resource: LegalResource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#C59A3D]/50 hover:shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-3">
        {resource.category ? (
          <span className="rounded-full bg-[#0F2747]/5 px-3 py-1 text-xs font-semibold text-[#0F2747]">
            {resource.category.name}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Legal Resource
          </span>
        )}

        <Scale className="h-5 w-5 text-[#C59A3D]" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-semibold leading-tight text-[#172033]">
        {resource.title}
      </h2>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
        {resource.summary}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {resource.law_name && (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {resource.law_name}
          </span>
        )}

        {resource.jurisdiction && (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {resource.jurisdiction}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          <span>
            {new Date(resource.updated_at).toLocaleDateString("en-PK", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <Link
          href={`/resources/${resource.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F2747] transition-colors hover:text-[#C59A3D]"
        >
          Read resource
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}