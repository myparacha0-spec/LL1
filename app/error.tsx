"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ResourcesErrorProps {
  reset: () => void;
}

export default function ResourcesError({
  reset,
}: ResourcesErrorProps) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#F8FAFC] px-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle
            className="h-7 w-7 text-red-600"
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[#172033]">
          Legal resources could not be loaded
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Something went wrong while loading the legal resource
          library. Please try again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F2747] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172033]"
        >
          <RefreshCw
            className="h-4 w-4"
            aria-hidden="true"
          />
          Try again
        </button>
      </section>
    </main>
  );
}