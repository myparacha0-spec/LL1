import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";

import { getProfile } from "./actions";
import { ProfileForm } from "@/components/citizen/profile-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My profile",
  description: "View and update your LegalEase citizen profile.",
  robots: { index: false },
};

export default async function CitizenProfilePage() {
  const result = await getProfile();

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-border bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy/5 text-navy">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                My profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                View and update the details LegalEase uses to help you. You can
                only edit your own information.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {result.status === "authenticated" ? (
          <ProfileForm profile={result.profile} />
        ) : result.status === "unauthenticated" ? (
          <UnauthenticatedNotice />
        ) : (
          <LoadErrorNotice />
        )}
      </section>
    </main>
  );
}

function UnauthenticatedNotice() {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-navy/5 text-navy">
        <ShieldCheck className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-heading text-xl font-bold text-navy">
        Please log in to access your profile
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Your profile is private to your account. Log in to view and update your
        details.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/signup">Create an account</Link>
        </Button>
      </div>
    </div>
  );
}

function LoadErrorNotice() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-gold-soft text-navy-dark">
        <ShieldCheck className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-heading text-xl font-bold text-navy">
        We couldn&apos;t load your profile
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Something went wrong while loading your details. Please refresh the page
        and try again.
      </p>
      <div className="mt-6">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/citizen/profile">Try again</Link>
        </Button>
      </div>
    </div>
  );
}
