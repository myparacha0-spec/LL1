import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CitizenProfile {
  full_name: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  cnic?: string | null;
  filer_status: string;
}

/** Human-readable label + styling for each filer status. */
const FILER_STATUS_STYLES: Record<
  string,
  { label: string; className: string; warn?: boolean }
> = {
  filer: {
    label: "Active Filer",
    className: "border-teal/30 bg-teal-soft text-teal font-semibold",
  },
  non_filer: {
    label: "Non-Filer",
    className: "border-gold/40 bg-gold-soft text-navy font-semibold",
  },
  unverified: {
    label: "Unverified Filer",
    className: "border-destructive/30 bg-destructive/10 text-destructive font-semibold",
    warn: true,
  },
};

function filerStatusMeta(status: string) {
  return (
    FILER_STATUS_STYLES[status] ?? {
      label: status.replace(/_/g, " "),
      className: "border-border bg-muted text-muted-foreground",
    }
  );
}

function getInitials(name: string | null) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string | null | undefined;
}) {
  const hasValue = Boolean(value && value.trim());
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 transition-colors hover:bg-slate-50">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-navy shadow-xs border border-slate-200/60">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span
        className={cn(
          "truncate text-xs font-medium text-right ml-2",
          hasValue ? "text-navy font-semibold" : "text-muted-foreground/60 italic"
        )}
      >
        {hasValue ? value : "Not provided"}
      </span>
    </div>
  );
}

export function ProfileSummaryCard({ profile }: { profile: CitizenProfile }) {
  const status = filerStatusMeta(profile.filer_status);
  const initials = getInitials(profile.full_name);

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/80 bg-white shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border/60 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-navy/5 text-navy">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <CardTitle className="font-heading text-base font-bold text-navy">
            Citizen Profile
          </CardTitle>
        </div>
        <Badge
          className={cn("gap-1 text-[11px] px-2.5 py-0.5 shadow-none", status.className)}
          aria-label={`Filer status: ${status.label}`}
        >
          {status.warn && <TriangleAlert className="!size-3" aria-hidden="true" />}
          {status.label}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between p-5 space-y-5">
        {/* User Card */}
        <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-slate-50/50 p-3.5">
          <Avatar className="size-11 border-2 border-white shadow-sm ring-1 ring-navy/10">
            <AvatarFallback className="bg-gradient-to-br from-navy to-navy-light text-xs font-bold text-white">
              {initials ?? <UserRound className="size-5" aria-hidden="true" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-bold text-navy">
              {profile.full_name?.trim() || "Citizen Account"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <span className="size-1.5 rounded-full bg-teal" />
              Verified LegalEase Citizen
            </p>
          </div>
        </div>

        {/* Details list */}
        <div className="space-y-2">
          <DetailRow icon={MapPin} label="City" value={profile.city} />
          <DetailRow icon={Building2} label="Area" value={profile.area} />
          <DetailRow icon={Phone} label="Phone" value={profile.phone} />
          {profile.cnic && (
            <DetailRow
              icon={CreditCard}
              label="CNIC"
              value={profile.cnic ? `${profile.cnic.slice(0, 5)}-*******-${profile.cnic.slice(-1)}` : null}
            />
          )}
        </div>

        {/* Bottom CTA to edit profile */}
        <div className="pt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-between border-navy/20 text-xs font-medium text-navy hover:bg-navy/5 hover:text-navy"
          >
            <Link href="/citizen/profile">
              <span>View & update profile</span>
              <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
