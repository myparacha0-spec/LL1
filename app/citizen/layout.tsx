import type { Metadata } from "next";
import { CitizenNav } from "@/components/citizen/citizen-nav";

export const metadata: Metadata = {
  title: {
    default: "Citizen Portal — LegalEase",
    template: "%s — Citizen Portal · LegalEase",
  },
};

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F8FAFC]">
      <CitizenNav />
      <div className="flex-1 pb-16">{children}</div>
    </div>
  );
}
