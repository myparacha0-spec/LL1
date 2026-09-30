"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

interface ResourceFiltersProps {
  search: string;
  category: string;
  jurisdiction: string;
  categories: {
    id: string;
    name: string;
  }[];
  jurisdictions: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onJurisdictionChange: (value: string) => void;
  onClear: () => void;
}

export function ResourceFilters({
  search,
  category,
  jurisdiction,
  categories,
  jurisdictions,
  onSearchChange,
  onCategoryChange,
  onJurisdictionChange,
  onClear,
}: ResourceFiltersProps) {
  const hasFilters = Boolean(search || category || jurisdiction);

  return (
    <section
      aria-label="Legal resource filters"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal
          className="h-5 w-5 text-[#C59A3D]"
          aria-hidden="true"
        />

        <h2 className="text-base font-semibold text-[#172033]">
          Find legal information
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <div className="relative">
          <label
            htmlFor="resource-search"
            className="sr-only"
          >
            Search legal resources
          </label>

          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            id="resource-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search laws, topics, sections..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-[#172033] outline-none transition focus:border-[#C59A3D] focus:bg-white focus:ring-2 focus:ring-[#C59A3D]/20"
          />
        </div>

        <div>
          <label
            htmlFor="resource-category"
            className="sr-only"
          >
            Filter by category
          </label>

          <select
            id="resource-category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172033] outline-none transition focus:border-[#C59A3D] focus:bg-white focus:ring-2 focus:ring-[#C59A3D]/20"
          >
            <option value="">All categories</option>

            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="resource-jurisdiction"
            className="sr-only"
          >
            Filter by jurisdiction
          </label>

          <select
            id="resource-jurisdiction"
            value={jurisdiction}
            onChange={(event) =>
              onJurisdictionChange(event.target.value)
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#172033] outline-none transition focus:border-[#C59A3D] focus:bg-white focus:ring-2 focus:ring-[#C59A3D]/20"
          >
            <option value="">All jurisdictions</option>

            {jurisdictions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:border-[#0F2747] hover:text-[#0F2747]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>
    </section>
  );
}
