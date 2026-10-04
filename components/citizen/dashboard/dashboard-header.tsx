"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function getInitials(name: string | null) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

interface DashboardHeaderProps {
  fullName: string | null;
}

export function DashboardHeader({ fullName }: DashboardHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = fullName?.trim() || "Citizen";
  const initials = getInitials(fullName);
  const busy = signingOut || isPending;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Even if network fails, redirect home
    } finally {
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
      setSigningOut(false);
    }
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="relative overflow-hidden rounded-2xl border border-navy/15 bg-gradient-to-br from-navy via-[#14325a] to-[#0d223d] p-6 text-white shadow-xl shadow-navy/10 sm:p-8">
      {/* Decorative background grid pattern and radial glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-teal/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* User Identity & Greeting */}
        <div className="flex items-start gap-4 sm:items-center">
          <div className="relative shrink-0">
            <Avatar className="size-14 border-2 border-gold/40 shadow-md ring-2 ring-white/10 sm:size-16">
              <AvatarFallback className="bg-gradient-to-br from-gold/30 to-navy text-base font-bold text-white">
                {initials ?? <UserRound className="size-6" aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
            <span
              className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-teal text-white ring-2 ring-navy"
              title="Verified Citizen Account"
            >
              <ShieldCheck className="size-3" aria-hidden="true" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-teal/40 bg-teal/15 px-2.5 py-0.5 text-[11px] font-medium text-teal-soft">
                <span className="size-1.5 rounded-full bg-teal" />
                Citizen Portal
              </span>
              <span className="hidden text-xs text-white/50 sm:inline">·</span>
              <span className="hidden text-xs text-white/60 sm:inline">
                {currentDate}
              </span>
            </div>

            <h1 className="mt-1.5 truncate font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {displayName}
            </h1>

            <p className="mt-1 text-xs text-white/70 sm:text-sm">
              Manage your legal matters, generate verified documents, and consult AI assistance.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center md:flex-nowrap">
          <Button
            asChild
            size="sm"
            className="bg-gold font-semibold text-navy shadow-sm transition-all hover:bg-gold/90 hover:shadow-md"
          >
            <Link href="/citizen/documents/create">
              <FileText className="size-3.5 mr-1" aria-hidden="true" />
              Draft Document
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
          >
            <Link href="/ai-assistant">
              <Sparkles className="size-3.5 mr-1 text-gold" aria-hidden="true" />
              Ask AI
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={busy}
            className="text-white/70 hover:bg-white/10 hover:text-white"
            title="Sign out of LegalEase"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-3.5" aria-hidden="true" />
            )}
            <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">
              {busy ? "Signing out…" : "Log out"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
