import Link from "next/link";
import { Search, ArrowRight, BookOpen, X } from "lucide-react";

import type {
  LegalResource,
  ResourceCategory,
} from "@/lib/data/resources";

interface ResourceLibraryProps {
  resources: LegalResource[];
  categories: ResourceCategory[];
  jurisdictions: string[];
  currentSearch: string;
  currentCategory: string;
  currentJurisdiction: string;
}

export function ResourceLibrary({
  resources,
  categories,
  jurisdictions,
  currentSearch,
  currentCategory,
  currentJurisdiction,
}: ResourceLibraryProps) {
  const hasFilters =
    Boolean(currentSearch) ||
    Boolean(currentCategory) ||
    Boolean(currentJurisdiction);

  return (
    <div>
      <form
        method="GET"
        action="/resources"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search laws, sections, topics..."
              maxLength={100}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/15"
            />
          </div>

          <select
            name="category"
            defaultValue={currentCategory}
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#172033] outline-none transition focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/15"
          >
            <option value="">All categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="jurisdiction"
            defaultValue={currentJurisdiction}
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#172033] outline-none transition focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/15"
          >
            <option value="">All Pakistan</option>

            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F2747] px-6 text-sm font-semibold text-white transition hover:bg-[#17365f]"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        {hasFilters && (
          <div className="mt-4">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F8B8D] hover:text-[#0F2747]"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Link>
          </div>
        )}
      </form>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {resources.length}{" "}
            {resources.length === 1 ? "resource" : "resources"} found
          </p>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <BookOpen className="h-7 w-7 text-slate-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#172033]">
            No legal resources found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try a different search term or remove one of the filters.
          </p>

          <Link
            href="/resources"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F2747] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17365f]"
          >
            View all resources
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <article
              key={resource.id}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#C59A3D]/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                {resource.category ? (
                  <span className="rounded-full bg-[#0F2747]/10 px-3 py-1 text-xs font-semibold text-[#0F2747]">
                    {resource.category.name}
                  </span>
                ) : (
                  <span />
                )}

                <span className="text-xs font-medium text-slate-500">
                  {resource.jurisdiction}
                </span>
              </div>

              <h2 className="mt-5 line-clamp-2 text-xl font-bold leading-7 text-[#172033]">
                {resource.title}
              </h2>

              <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                {resource.summary}
              </p>

              <div className="mt-5 space-y-1.5 text-xs text-slate-500">
                {resource.law_name && (
                  <p>
                    <span className="font-semibold text-slate-700">Law:</span>{" "}
                    {resource.law_name}
                  </p>
                )}

                {resource.section_reference && (
                  <p>
                    <span className="font-semibold text-slate-700">
                      Section:
                    </span>{" "}
                    {resource.section_reference}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-7">
                <Link
                  href={`/resources/${resource.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F8B8D] transition group-hover:text-[#0F2747]"
                >
                  Read resource
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}