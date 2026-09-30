import { Info } from "lucide-react";

export function LegalInformationDisclaimer() {
  return (
    <aside
      role="note"
      className="rounded-2xl border border-[#C59A3D]/30 bg-[#C59A3D]/5 p-5"
    >
      <div className="flex gap-3">
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-[#C59A3D]"
          aria-hidden="true"
        />

        <div>
          <h2 className="text-sm font-semibold text-[#172033]">
            General legal information
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            The information provided in LegalEase is for general
            informational purposes only. It is based on the cited legal
            sources and is not a substitute for advice from a qualified
            lawyer. Laws and procedures may change, and their application
            depends on the facts and jurisdiction of each case.
          </p>
        </div>
      </div>
    </aside>
  );
}