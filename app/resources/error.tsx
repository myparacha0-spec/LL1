"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ResourcesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResourcesError({
  error,
  reset,
}: ResourcesErrorProps) {
  useEffect(() => {
    console.error("Resources page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#F8FAFC] px-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#172033]">
          Resources could not be loaded
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Something went wrong while loading the Pakistan legal resources.
          Please try again.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0F2747] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17365f]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </section>
    </main>
  );
}