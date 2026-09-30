import type { Metadata } from "next";
import { BookOpen, Scale } from "lucide-react";

import {
  getPublishedResources,
  getResourceCategories,
  getResourceJurisdictions,
} from "@/lib/data/resources";

import { LegalInformationDisclaimer } from "@/components/marketing/legal-information-disclaimer";
import { ResourceLibrary } from "@/components/marketing/resource-library";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Legal Resources | LegalEase",
  description:
    "Pakistan-focused legal information, guides, rights, procedures, and verified legal resources.",
};

interface ResourcesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    jurisdiction?: string;
  }>;
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const params = await searchParams;

  const currentSearch =
    typeof params.search === "string" ? params.search.trim() : "";

  const currentCategory =
    typeof params.category === "string" ? params.category.trim() : "";

  const currentJurisdiction =
    typeof params.jurisdiction === "string"
      ? params.jurisdiction.trim()
      : "";

  const [resources, categories, jurisdictions] = await Promise.all([
    getPublishedResources({
      search: currentSearch,
      category: currentCategory,
      jurisdiction: currentJurisdiction,
    }),
    getResourceCategories(),
    getResourceJurisdictions(),
  ]);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-slate-200 bg-[#0F2747]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white">
              <BookOpen
                className="h-4 w-4 text-[#C59A3D]"
                aria-hidden="true"
              />
              Legal Resource Library
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Understand your legal rights and options.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Explore Pakistan-focused legal information covering laws,
              rights, procedures, and common legal topics in simple language.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C59A3D]/10">
            <Scale
              className="h-5 w-5 text-[#C59A3D]"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#172033]">
              Browse legal information
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Search by topic, law, section, category, or jurisdiction.
            </p>
          </div>
        </div>

        <ResourceLibrary
          resources={resources}
          categories={categories}
          jurisdictions={jurisdictions}
          currentSearch={currentSearch}
          currentCategory={currentCategory}
          currentJurisdiction={currentJurisdiction}
        />

        <div className="mt-10">
          <LegalInformationDisclaimer />
        </div>
      </section>
    </main>
  );
}