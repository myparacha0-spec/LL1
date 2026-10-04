"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/lawyers", label: "Find a lawyer" },
  { href: "/ai-assistant", label: "AI assistant" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-navy"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {pathname.startsWith("/citizen") ? (
            <>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-navy">
                <Link href="/citizen/documents">My Documents</Link>
              </Button>
              <Button asChild size="sm" className="bg-navy text-white hover:bg-navy-light shadow-sm">
                <Link href="/citizen/dashboard">Citizen Portal</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <MobileNav pathname={pathname} />
        </div>
      </div>
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const isCitizen = pathname.startsWith("/citizen");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 gap-0 p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-16 items-center border-b border-border/70 px-4">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
          {isCitizen && (
            <div className="mb-2 rounded-lg border border-navy/15 bg-navy/5 p-2 text-xs font-semibold text-navy">
              Citizen Portal
              <div className="mt-1 flex flex-col gap-1 font-normal">
                <Link
                  href="/citizen/dashboard"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    pathname === "/citizen/dashboard" ? "bg-navy text-white font-medium" : "text-navy hover:bg-navy/10"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/citizen/documents"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    pathname.startsWith("/citizen/documents") ? "bg-navy text-white font-medium" : "text-navy hover:bg-navy/10"
                  )}
                >
                  My Documents
                </Link>
                <Link
                  href="/citizen/profile"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    pathname === "/citizen/profile" ? "bg-navy text-white font-medium" : "text-navy hover:bg-navy/10"
                  )}
                >
                  My Profile
                </Link>
              </div>
            </div>
          )}
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-navy"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border/70 p-4">
          {isCitizen ? (
            <Button asChild className="w-full bg-navy text-white hover:bg-navy-light">
              <Link href="/citizen/dashboard">Go to Citizen Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup">
                  <Sparkles />
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}