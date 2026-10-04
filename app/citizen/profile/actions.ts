"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * LE-302 — Citizen Profile & Settings (server actions).
 *
 * Reads and updates the signed-in citizen's own row in `public.users`.
 *
 * Security model (defence in depth):
 *   - Supabase RLS on `public.users` restricts every operation to the row
 *     where `auth.uid() = id`.
 *   - Every action re-verifies the authenticated user with `auth.getUser()`
 *     before touching the database.
 *   - `updateProfile` explicitly whitelists the editable columns
 *     (full_name, phone, cnic, city, area) and never spreads client input.
 *   - Protected columns (id, role, filer_status, created_at, updated_at) are
 *     never accepted from the client and never written.
 *   - No service-role key is used, so RLS is always enforced.
 */

export interface CitizenProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  cnic: string | null;
  city: string | null;
  area: string | null;
  role: string | null;
  filer_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Only the fields a citizen is allowed to change. */
export interface ProfileFormValues {
  full_name: string;
  phone: string;
  cnic: string;
  city: string;
  area: string;
}

export type GetProfileResult =
  | { status: "authenticated"; profile: CitizenProfile }
  | { status: "unauthenticated" }
  | { status: "error" };

export type UpdateProfileResult =
  | { success: true; profile: CitizenProfile }
  | { success: false; error: string };

/** Columns returned to the UI (never includes anything the user can write to). */
const PROFILE_COLUMNS =
  "id, full_name, phone, cnic, city, area, role, filer_status, created_at, updated_at";

const PHONE_PATTERN = /^\+?\d{10,15}$/;
const CNIC_PATTERN = /^\d{13}$/;

function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.replace(/[\s-]/g, ""));
}

function isValidCnic(value: string): boolean {
  return CNIC_PATTERN.test(value.replace(/-/g, ""));
}

/**
 * Builds the exact, whitelisted update payload from untrusted input.
 * Any extra/unknown field is ignored. Never returns id, role, filer_status,
 * created_at, or updated_at.
 */
function buildValidatedUpdate(
  input: unknown,
):
  | {
      ok: true;
      update: {
        full_name: string;
        phone: string | null;
        cnic: string | null;
        city: string | null;
        area: string | null;
      };
    }
  | { ok: false; error: string } {
  const source = (input ?? {}) as Record<string, unknown>;

  const read = (key: string): string =>
    typeof source[key] === "string" ? (source[key] as string).trim() : "";

  const full_name = read("full_name");
  const phone = read("phone");
  const cnic = read("cnic");
  const city = read("city");
  const area = read("area");

  if (full_name.length === 0) {
    return { ok: false, error: "Please enter your full name." };
  }

  if (full_name.length < 2) {
    return {
      ok: false,
      error: "Your full name must be at least 2 characters.",
    };
  }

  if (full_name.length > 120) {
    return {
      ok: false,
      error: "Your full name must be 120 characters or fewer.",
    };
  }

  if (phone.length > 0 && !isValidPhone(phone)) {
    return {
      ok: false,
      error: "Please enter a valid phone number, for example +92 300 1234567.",
    };
  }

  if (cnic.length > 0 && !isValidCnic(cnic)) {
    return {
      ok: false,
      error:
        "Please enter a valid CNIC with 13 digits, for example 12345-1234567-1.",
    };
  }

  if (city.length > 80) {
    return { ok: false, error: "City name must be 80 characters or fewer." };
  }

  if (area.length > 80) {
    return { ok: false, error: "Area name must be 80 characters or fewer." };
  }

  return {
    ok: true,
    update: {
      full_name,
      phone: phone.length > 0 ? phone : null,
      cnic: cnic.length > 0 ? cnic : null,
      city: city.length > 0 ? city : null,
      area: area.length > 0 ? area : null,
    },
  };
}

/**
 * Returns the signed-in citizen's own profile.
 * Never throws: unauthenticated users get a clear result, DB problems get
 * an `error` result the UI can render gracefully.
 */
export async function getProfile(): Promise<GetProfileResult> {
  let supabase;

  try {
    supabase = await createClient();
  } catch {
    return { status: "error" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return { status: "error" };
  }

  return { status: "authenticated", profile: data as CitizenProfile };
}

/**
 * Updates the signed-in citizen's own profile.
 *
 * Only `full_name`, `phone`, `cnic`, `city`, and `area` are ever written.
 * The update is scoped to the authenticated user's row (`id = user.id`) and
 * additionally protected by RLS.
 */
export async function updateProfile(
  values: ProfileFormValues,
): Promise<UpdateProfileResult> {
  let supabase;

  try {
    supabase = await createClient();
  } catch {
    return {
      success: false,
      error: "Saving is temporarily unavailable. Please try again.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You are not signed in. Please log in and try again.",
    };
  }

  const validated = buildValidatedUpdate(values);

  if (!validated.ok) {
    return { success: false, error: validated.error };
  }

  const { data, error } = await supabase
    .from("users")
    .update(validated.update)
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: "We couldn't save your profile right now. Please try again.",
    };
  }

  if (!data) {
    return {
      success: false,
      error:
        "We couldn't find your profile to update. Please refresh the page and try again.",
    };
  }

  revalidatePath("/citizen/profile");

  return { success: true, profile: data as CitizenProfile };
}
