"use client";

import { useState } from "react";
import { CircleAlert, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { updateProfile, type CitizenProfile } from "@/app/citizen/profile/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  profile: CitizenProfile;
}

interface FormValues {
  full_name: string;
  phone: string;
  cnic: string;
  city: string;
  area: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const PHONE_PATTERN = /^\+?\d{10,15}$/;
const CNIC_PATTERN = /^\d{13}$/;

function toFormValues(profile: CitizenProfile): FormValues {
  return {
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    cnic: profile.cnic ?? "",
    city: profile.city ?? "",
    area: profile.area ?? "",
  };
}

/** Mirror of the server validation so the user gets immediate feedback. */
function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const fullName = values.full_name.trim();

  if (fullName.length === 0) {
    errors.full_name = "Please enter your full name.";
  } else if (fullName.length < 2) {
    errors.full_name = "Your full name must be at least 2 characters.";
  } else if (fullName.length > 120) {
    errors.full_name = "Your full name must be 120 characters or fewer.";
  }

  const phone = values.phone.replace(/[\s-]/g, "");
  if (values.phone.trim().length > 0 && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid phone number, for example +92 300 1234567.";
  }

  const cnic = values.cnic.replace(/-/g, "");
  if (values.cnic.trim().length > 0 && !CNIC_PATTERN.test(cnic)) {
    errors.cnic = "Enter a valid CNIC with 13 digits, e.g. 12345-1234567-1.";
  }

  if (values.city.trim().length > 80) {
    errors.city = "City name must be 80 characters or fewer.";
  }

  if (values.area.trim().length > 80) {
    errors.area = "Area name must be 80 characters or fewer.";
  }

  return errors;
}

function Field({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  disabled,
  ...inputProps
}: {
  id: keyof FormValues;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "id" | "disabled">) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(profile));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setFeedback(null);

    const errors = validate(values);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      const result = await updateProfile(values);

      if (result.success) {
        setValues(toFormValues(result.profile));
        setFieldErrors({});
        setFeedback({
          type: "success",
          message: "Your profile has been saved.",
        });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    } catch {
      setFeedback({
        type: "error",
        message:
          "We couldn't save your profile right now. Please check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>
            Update the information below and choose Save changes. Your name,
            phone, CNIC, city, and area are the only fields you can edit here.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  id="full_name"
                  label="Full name"
                  value={values.full_name}
                  onChange={(value) => updateField("full_name", value)}
                  error={fieldErrors.full_name}
                  disabled={saving}
                  autoComplete="name"
                  placeholder="Aliya Khan"
                />
              </div>

              <Field
                id="phone"
                label="Phone"
                value={values.phone}
                onChange={(value) => updateField("phone", value)}
                error={fieldErrors.phone}
                disabled={saving}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+92 300 1234567"
                hint="Optional. Include the country code."
              />

              <Field
                id="cnic"
                label="CNIC"
                value={values.cnic}
                onChange={(value) => updateField("cnic", value)}
                error={fieldErrors.cnic}
                disabled={saving}
                inputMode="numeric"
                placeholder="12345-1234567-1"
                hint="Optional. 13 digits."
              />

              <Field
                id="city"
                label="City"
                value={values.city}
                onChange={(value) => updateField("city", value)}
                error={fieldErrors.city}
                disabled={saving}
                autoComplete="address-level2"
                placeholder="Karachi"
              />

              <Field
                id="area"
                label="Area"
                value={values.area}
                onChange={(value) => updateField("area", value)}
                error={fieldErrors.area}
                disabled={saving}
                autoComplete="address-level3"
                placeholder="Clifton"
              />
            </div>

            {feedback && (
              <div
                role={feedback.type === "error" ? "alert" : "status"}
                aria-live={feedback.type === "error" ? "assertive" : "polite"}
                className={
                  feedback.type === "success"
                    ? "flex items-start gap-3 rounded-xl border border-teal/40 bg-teal-soft px-4 py-3"
                    : "flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
                }
              >
                {feedback.type === "success" ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-teal"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                )}
                <p
                  className={
                    feedback.type === "success"
                      ? "text-sm font-medium text-navy"
                      : "text-sm font-medium text-destructive"
                  }
                >
                  {feedback.message}
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Changes are saved to your LegalEase account.
              </p>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-gold-soft text-navy-dark">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">
                Account information is protected
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your role and filer status are managed by LegalEase and can&apos;t
                be changed from this page. Only you can view or edit the details
                shown above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
