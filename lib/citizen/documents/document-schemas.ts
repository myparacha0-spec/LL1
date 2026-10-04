/**
 * LE-305 Document Assistance — Zod validation schemas
 *
 * Request schemas for structured input forms and free-form AI requests.
 * Response schema for the AI generation result.
 */

import { z } from "zod";
import type { DocumentType } from "./document-types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const nonEmpty = (label: string) =>
  z.string().min(1, `${label} is required.`).max(2000, `${label} is too long.`);

const optionalText = z.string().max(2000).optional();

// ---------------------------------------------------------------------------
// Structured input schemas — one per document type
// ---------------------------------------------------------------------------

export const firInputSchema = z.object({
  complainant_name: nonEmpty("Complainant name"),
  complainant_cnic: z.string().max(20).optional(),
  complainant_contact: z.string().max(20).optional(),
  complainant_address: nonEmpty("Complainant address"),
  accused_name: nonEmpty("Accused name"),
  incident_date: nonEmpty("Incident date"),
  incident_time: z.string().max(50).optional(),
  incident_location: nonEmpty("Incident location"),
  police_station: nonEmpty("Police station"),
  offence_type: nonEmpty("Offence type"),
  incident_description: nonEmpty("Incident description"),
  witnesses: optionalText,
  evidence: optionalText,
  relief_sought: nonEmpty("Relief sought"),
});

export const complaintInputSchema = z.object({
  complainant_name: nonEmpty("Complainant name"),
  complainant_address: nonEmpty("Complainant address"),
  complainant_contact: z.string().max(50).optional(),
  respondent_name: nonEmpty("Respondent name"),
  respondent_address: optionalText,
  complaint_forum: nonEmpty("Complaint forum"),
  complaint_subject: nonEmpty("Complaint subject"),
  incident_date: nonEmpty("Incident date"),
  facts: nonEmpty("Facts of the matter"),
  relief_sought: nonEmpty("Relief sought"),
  supporting_documents: optionalText,
});

export const legalNoticeInputSchema = z.object({
  sender_name: nonEmpty("Sender name"),
  sender_address: nonEmpty("Sender address"),
  sender_contact: z.string().max(100).optional(),
  recipient_name: nonEmpty("Recipient name"),
  recipient_address: nonEmpty("Recipient address"),
  notice_subject: nonEmpty("Notice subject"),
  notice_type: nonEmpty("Notice type"),
  facts_grievance: nonEmpty("Facts and grievance"),
  amount_claimed: z.string().max(50).optional(),
  compliance_period: nonEmpty("Compliance period"),
  legal_action: nonEmpty("Intended legal action"),
});

export const applicationInputSchema = z.object({
  applicant_name: nonEmpty("Applicant name"),
  applicant_address: nonEmpty("Applicant address"),
  applicant_contact: z.string().max(100).optional(),
  addressee: nonEmpty("Addressee"),
  organisation: nonEmpty("Organisation"),
  application_type: nonEmpty("Application type"),
  application_subject: nonEmpty("Application subject"),
  details: nonEmpty("Details"),
  request: nonEmpty("Specific request"),
  supporting_documents: optionalText,
});

// Union of all structured input schemas
export type FirInput = z.infer<typeof firInputSchema>;
export type ComplaintInput = z.infer<typeof complaintInputSchema>;
export type LegalNoticeInput = z.infer<typeof legalNoticeInputSchema>;
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export type StructuredInput =
  | FirInput
  | ComplaintInput
  | LegalNoticeInput
  | ApplicationInput;

// ---------------------------------------------------------------------------
// API request schema
// ---------------------------------------------------------------------------

export const generateRequestSchema = z
  .object({
    mode: z.enum(["template", "freeform"]),
    document_type: z
      .enum(["fir", "complaint", "legal_notice", "application"])
      .optional(),
    input_data: z.record(z.string(), z.unknown()).optional(),
    freeform_query: z.string().min(5, "Request is too short.").max(3000).optional(),
  })
  .refine(
    (v) => {
      if (v.mode === "template") {
        return !!v.document_type && !!v.input_data;
      }
      return !!v.freeform_query;
    },
    {
      message:
        "Template mode requires document_type and input_data. Freeform mode requires freeform_query.",
    }
  );

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// ---------------------------------------------------------------------------
// Save request schema (POST /api/citizen/documents)
// ---------------------------------------------------------------------------

export const saveDocumentSchema = z.object({
  template_id: z.enum(["fir", "complaint", "legal_notice", "application"]),
  title: nonEmpty("Title").max(255),
  document_type: nonEmpty("Document type").max(50),
  input_data: z.record(z.string(), z.unknown()),
  generated_content: nonEmpty("Generated content"),
  status: z.enum(["draft", "complete"]).default("draft"),
});

export type SaveDocumentInput = z.infer<typeof saveDocumentSchema>;

// ---------------------------------------------------------------------------
// AI generation response schema
// ---------------------------------------------------------------------------

export const generationResponseSchema = z.object({
  document_type: z.string(),
  title: z.string(),
  generated_content: z.string(),
  is_ready: z.boolean(),
  missing_fields: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  citations: z
    .array(
      z.object({
        title: z.string(),
        section: z.string().nullish(),
        article: z.string().nullish(),
      })
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
  disclaimer: z.string().default(
    "This document is an AI-assisted draft generated for informational purposes only. It should be reviewed by a qualified lawyer before submission to any court, authority, or third party."
  ),
  rag_sources: z
    .array(
      z.object({
        title: z.string(),
        category: z.string().optional(),
        jurisdiction_level: z.string().optional(),
      })
    )
    .default([]),
});

export type GenerationResponse = z.infer<typeof generationResponseSchema>;

// ---------------------------------------------------------------------------
// DB row type (matches public.citizen_documents)
// ---------------------------------------------------------------------------

export interface CitizenDocumentRow {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  document_type: string;
  input_data: Record<string, unknown>;
  generated_content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Update schema (PATCH)
// ---------------------------------------------------------------------------

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  generated_content: z.string().min(1).optional(),
  status: z.enum(["draft", "complete"]).optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// Helper — get the schema for a given document type
export function getStructuredSchema(type: DocumentType) {
  switch (type) {
    case "fir":
      return firInputSchema;
    case "complaint":
      return complaintInputSchema;
    case "legal_notice":
      return legalNoticeInputSchema;
    case "application":
      return applicationInputSchema;
  }
}
