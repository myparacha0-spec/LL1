import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  FileText,
  Search,
  Sparkles,
  UserRound,
  ArrowRight,
  Clock,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/citizen/dashboard/dashboard-header";
import {
  ProfileSummaryCard,
  type CitizenProfile,
} from "@/components/citizen/dashboard/profile-summary-card";
import { QuickActionCard } from "@/components/citizen/dashboard/quick-action-card";
import type { CitizenDocumentRow } from "@/lib/citizen/documents/document-schemas";

export const metadata: Metadata = {
  title: "Citizen Dashboard — LegalEase",
  description: "Your executive legal portal for AI document generation, case research, and lawyer discovery.",
  robots: { index: false },
};

function docTypeLabel(type: string): string {
  switch (type) {
    case "fir":
      return "FIR";
    case "complaint":
      return "Complaint";
    case "legal_notice":
      return "Legal Notice";
    case "application":
      return "Application";
    default:
      return type;
  }
}

function docTypeIcon(type: string): string {
  switch (type) {
    case "fir":
      return "🚨";
    case "complaint":
      return "📋";
    case "legal_notice":
      return "📜";
    case "application":
      return "📝";
    default:
      return "📄";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Citizen Quick Actions with real routes and hierarchy.
 * As instructed:
 *  - Ask AI Legal Assistant -> existing Zamin AI/RAG (/ai-assistant)
 *  - Generate a Document -> /citizen/documents
 *  - Browse Legal Resources -> /resources
 *  - Find a Lawyer -> /lawyers
 *  - My Appointments -> in development
 */
const QUICK_ACTIONS = [
  {
    title: "Ask AI Legal Assistant",
    description:
      "Get instant, plain-language legal guidance and next steps for your situation.",
    icon: <Sparkles className="size-5 text-teal" />,
    href: "/ai-assistant",
    comingSoon: false,
    badge: "AI Powered",
  },
  {
    title: "Generate a Document",
    description:
      "Draft Pakistan-compliant legal documents from verified templates or plain language.",
    icon: <FileText className="size-5 text-navy" />,
    href: "/citizen/documents",
    comingSoon: false,
    badge: "Smart Draft",
  },
  {
    title: "Browse Legal Resources",
    description:
      "Statutory guides, consumer rights, and preparation templates before you consult.",
    icon: <BookOpenText className="size-5 text-gold" />,
    href: "/resources",
    comingSoon: false,
    badge: "Self Help",
  },
  {
    title: "Find a Lawyer",
    description:
      "Connect with verified advocates across Pakistan by practice area and city.",
    icon: <Search className="size-5 text-navy" />,
    href: "/lawyers",
    comingSoon: false,
    badge: "Directory",
  },
  {
    title: "My Appointments",
    description:
      "Track scheduled and past consultations with your verified advocates.",
    icon: <CalendarDays className="size-5 text-muted-foreground" />,
    comingSoon: true,
  },
] as const;

export default async function CitizenDashboardPage() {
  const supabase = await createClient();

  // Authoritative server-side auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/citizen/dashboard");
  }

  // Fetch the citizen's profile
  const { data: profile, error } = await supabase
    .from("users")
    .select("full_name, phone, cnic, city, area, role, filer_status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load your profile: ${error.message}`);
  }

  // Role guard: only citizens may use this dashboard
  if (profile?.role && profile.role !== "citizen") {
    redirect("/");
  }

  // Fetch citizen's real recent documents for the dashboard section
  const { data: recentDocuments } = await supabase
    .from("citizen_documents")
    .select("id, title, document_type, template_id, status, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(3)
    .returns<CitizenDocumentRow[]>();

  // Profile row missing fallback
  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="rounded-2xl border-border bg-white shadow-sm">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-gold-soft text-navy">
              <UserRound className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-navy">
                Complete your profile
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                We couldn&apos;t find your LegalEase profile yet. Finish setting
                up your account to access your full citizen workspace.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="bg-navy hover:bg-navy-light text-white">
                <Link href="/citizen/profile">Complete Profile</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const citizenProfile: CitizenProfile = {
    full_name: profile.full_name,
    city: profile.city,
    area: profile.area,
    phone: profile.phone,
    cnic: profile.cnic,
    filer_status: profile.filer_status,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Executive Welcome & Header */}
      <DashboardHeader fullName={profile.full_name} />

      {/* 2. Main Grid: Profile Summary + Quick Action Services */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left Column: Citizen Identity & Filer Status */}
        <div className="lg:col-span-1">
          <ProfileSummaryCard profile={citizenProfile} />
        </div>

        {/* Right Column: Quick Action Cards */}
        <section
          aria-label="Legal Services"
          className="grid gap-4 sm:grid-cols-2 lg:col-span-2"
        >
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.title}
              icon={action.icon}
              title={action.title}
              description={action.description}
              href={"href" in action ? action.href : undefined}
              comingSoon={action.comingSoon}
              badge={"badge" in action ? action.badge : undefined}
            />
          ))}
        </section>
      </div>

      {/* 3. My Documents / Recent Documents Section */}
      <section className="mt-10 rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-navy/5 text-navy">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-navy">
                My Legal Documents
              </h2>
              <p className="text-xs text-muted-foreground">
                Your recent AI drafts, legal notices, and applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-navy/20 text-xs font-semibold text-navy hover:bg-navy/5"
            >
              <Link href="/citizen/documents">
                View all ({recentDocuments?.length ?? 0})
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-navy text-xs font-semibold text-white shadow-xs hover:bg-navy-light"
            >
              <Link href="/citizen/documents/create">
                <Plus className="size-3.5 mr-1" aria-hidden="true" />
                New Document
              </Link>
            </Button>
          </div>
        </div>

        {recentDocuments && recentDocuments.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-navy/30 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg">
                      {docTypeIcon(doc.document_type ?? doc.template_id)}
                    </span>
                    <Badge
                      variant={doc.status === "complete" ? "default" : "secondary"}
                      className="text-[10px] py-0 px-2 font-medium"
                    >
                      {doc.status === "complete" ? "Ready" : "Draft"}
                    </Badge>
                  </div>
                  <h3 className="mt-2.5 font-heading text-sm font-bold text-navy truncate">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {docTypeLabel(doc.document_type ?? doc.template_id)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="size-3 text-slate-400" aria-hidden="true" />
                    {formatDate(doc.updated_at)}
                  </span>
                  <Link
                    href={`/citizen/documents/${doc.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-navy group-hover:text-teal transition-colors"
                  >
                    Open
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-white text-navy shadow-xs border border-slate-200/60">
              <FileText className="size-5 text-navy/70" aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-heading text-sm font-bold text-navy">
              No documents created yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Generate FIR drafts, rent notices, or consumer complaints tailored to Pakistan law.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-4 bg-navy text-xs font-semibold text-white hover:bg-navy-light"
            >
              <Link href="/citizen/documents/create">
                <Plus className="size-3.5 mr-1" aria-hidden="true" />
                Draft your first document
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* 4. Professional Legal Disclaimer Banner */}
      <footer className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-4 shrink-0 mt-0.5 text-navy/60" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-navy">LegalEase Citizen Advisory: </strong>
            LegalEase AI provides informational guidance and automated drafts under Pakistan statutory guidelines.
            It does not constitute formal legal representation. Always verify legal instruments with a qualified advocate before filing.
          </p>
        </div>
      </footer>
    </div>
  );
}
