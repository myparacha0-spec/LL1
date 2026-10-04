/**
 * LE-305 Document Assistance — Document type definitions
 *
 * Defines the four supported document types (FIR, Complaint, Legal Notice,
 * Application) and their structured field descriptors.
 */

export type DocumentType = "fir" | "complaint" | "legal_notice" | "application";

export type FieldType = "text" | "textarea" | "date" | "select";

export interface DocumentField {
  id: string;
  label: string;
  placeholder: string;
  type: FieldType;
  required: boolean;
  /** hint shown below the field */
  hint?: string;
  options?: { value: string; label: string }[];
  /** used for AI missing-field detection */
  ragKey?: string;
}

export interface DocumentTemplate {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  color: string; // tailwind bg class
  fields: DocumentField[];
  /** RAG category hint for legal retrieval */
  ragCategory: string | null;
}

// ---------------------------------------------------------------------------
// FIR — First Information Report
// ---------------------------------------------------------------------------
const firFields: DocumentField[] = [
  {
    id: "complainant_name",
    label: "Complainant Full Name",
    placeholder: "Your full name as per CNIC",
    type: "text",
    required: true,
    ragKey: "complainant_name",
  },
  {
    id: "complainant_cnic",
    label: "Complainant CNIC",
    placeholder: "XXXXX-XXXXXXX-X",
    type: "text",
    required: false,
    hint: "Optional but recommended for official FIR submission",
  },
  {
    id: "complainant_contact",
    label: "Complainant Contact Number",
    placeholder: "03XX-XXXXXXX",
    type: "text",
    required: false,
  },
  {
    id: "complainant_address",
    label: "Complainant Address",
    placeholder: "House #, Street, Area, City",
    type: "textarea",
    required: true,
    ragKey: "complainant_address",
  },
  {
    id: "accused_name",
    label: "Accused Person(s) Name",
    placeholder: "Full name(s) of accused (or 'Unknown')",
    type: "text",
    required: true,
    hint: "Write 'Unknown' if identity is not known",
    ragKey: "accused_name",
  },
  {
    id: "incident_date",
    label: "Date of Incident",
    placeholder: "",
    type: "date",
    required: true,
    ragKey: "incident_date",
  },
  {
    id: "incident_time",
    label: "Approximate Time of Incident",
    placeholder: "e.g. 10:30 PM",
    type: "text",
    required: false,
  },
  {
    id: "incident_location",
    label: "Location of Incident",
    placeholder: "Street, Area, City where incident occurred",
    type: "textarea",
    required: true,
    ragKey: "incident_location",
  },
  {
    id: "police_station",
    label: "Police Station (Thana)",
    placeholder: "Name of the relevant police station",
    type: "text",
    required: true,
  },
  {
    id: "offence_type",
    label: "Nature of Offence",
    placeholder: "e.g. Theft, Robbery, Assault, Mobile Snatching",
    type: "select",
    required: true,
    ragKey: "offence_type",
    options: [
      { value: "theft", label: "Theft (Chor)" },
      { value: "robbery", label: "Robbery / Snatching" },
      { value: "assault", label: "Assault / Physical Attack" },
      { value: "fraud", label: "Fraud / Cheating" },
      { value: "extortion", label: "Extortion / Blackmail" },
      { value: "harassment", label: "Harassment / Intimidation" },
      { value: "domestic_violence", label: "Domestic Violence" },
      { value: "kidnapping", label: "Kidnapping / Abduction" },
      { value: "murder_attempt", label: "Attempt to Murder" },
      { value: "property_damage", label: "Property Damage" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "incident_description",
    label: "Incident Description",
    placeholder:
      "Describe exactly what happened: sequence of events, what was said or done, who was present, property involved, injuries sustained...",
    type: "textarea",
    required: true,
    hint: "Be as specific as possible — dates, amounts, descriptions, witnesses",
    ragKey: "incident_description",
  },
  {
    id: "witnesses",
    label: "Witnesses (if any)",
    placeholder: "Names and contact details of witnesses",
    type: "textarea",
    required: false,
  },
  {
    id: "evidence",
    label: "Evidence Available",
    placeholder: "e.g. CCTV footage, screenshots, medical report, receipts",
    type: "textarea",
    required: false,
  },
  {
    id: "relief_sought",
    label: "Relief / Action Requested",
    placeholder: "What action do you want the police to take?",
    type: "textarea",
    required: true,
    ragKey: "relief_sought",
  },
];

// ---------------------------------------------------------------------------
// Complaint
// ---------------------------------------------------------------------------
const complaintFields: DocumentField[] = [
  {
    id: "complainant_name",
    label: "Complainant Full Name",
    placeholder: "Your full legal name",
    type: "text",
    required: true,
    ragKey: "complainant_name",
  },
  {
    id: "complainant_address",
    label: "Complainant Address",
    placeholder: "Your full address",
    type: "textarea",
    required: true,
  },
  {
    id: "complainant_contact",
    label: "Contact Number",
    placeholder: "03XX-XXXXXXX",
    type: "text",
    required: false,
  },
  {
    id: "respondent_name",
    label: "Respondent / Opposite Party Name",
    placeholder: "Full name of person / organisation being complained against",
    type: "text",
    required: true,
    ragKey: "respondent_name",
  },
  {
    id: "respondent_address",
    label: "Respondent Address",
    placeholder: "Address of respondent",
    type: "textarea",
    required: false,
    hint: "Include if known — improves complaint effectiveness",
  },
  {
    id: "complaint_forum",
    label: "Complaint Forum / Authority",
    placeholder: "e.g. NEPRA, OGRA, Consumer Court, Labour Court, SECP",
    type: "select",
    required: true,
    options: [
      { value: "consumer_court", label: "Consumer Court / Protection Council" },
      { value: "nepra", label: "NEPRA (Electricity)" },
      { value: "ogra", label: "OGRA (Gas / Petroleum)" },
      { value: "pta", label: "PTA (Telecom)" },
      { value: "secp", label: "SECP (Corporate / Financial)" },
      { value: "labour_court", label: "Labour Court" },
      { value: "banking_ombudsman", label: "Banking Ombudsman" },
      { value: "fbr", label: "FBR (Tax)" },
      { value: "district_court", label: "District Court" },
      { value: "university", label: "University / Educational Institution" },
      { value: "police_authority", label: "Police / Law Enforcement Authority" },
      { value: "other", label: "Other Authority" },
    ],
  },
  {
    id: "complaint_subject",
    label: "Subject of Complaint",
    placeholder: "e.g. Unpaid security deposit, Defective product, Wrongful dismissal",
    type: "text",
    required: true,
    ragKey: "complaint_subject",
  },
  {
    id: "incident_date",
    label: "Date(s) of Incident",
    placeholder: "",
    type: "date",
    required: true,
    ragKey: "incident_date",
  },
  {
    id: "facts",
    label: "Facts of the Matter",
    placeholder:
      "Describe the facts chronologically: what happened, dates, amounts, agreements, communications...",
    type: "textarea",
    required: true,
    hint: "Include all relevant facts in chronological order",
    ragKey: "facts",
  },
  {
    id: "relief_sought",
    label: "Relief / Remedy Requested",
    placeholder:
      "e.g. Return of security deposit PKR 50,000, Compensation, Reinstatement...",
    type: "textarea",
    required: true,
    ragKey: "relief_sought",
  },
  {
    id: "supporting_documents",
    label: "Supporting Documents / Evidence",
    placeholder: "List documents you have: agreements, receipts, bills, messages...",
    type: "textarea",
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Legal Notice
// ---------------------------------------------------------------------------
const legalNoticeFields: DocumentField[] = [
  {
    id: "sender_name",
    label: "Sender Full Name",
    placeholder: "Your full legal name",
    type: "text",
    required: true,
    ragKey: "sender_name",
  },
  {
    id: "sender_address",
    label: "Sender Address",
    placeholder: "Your full address",
    type: "textarea",
    required: true,
  },
  {
    id: "sender_contact",
    label: "Sender Contact / Email",
    placeholder: "Phone or email",
    type: "text",
    required: false,
  },
  {
    id: "recipient_name",
    label: "Recipient Full Name",
    placeholder: "Full name of person / entity receiving the notice",
    type: "text",
    required: true,
    ragKey: "recipient_name",
  },
  {
    id: "recipient_address",
    label: "Recipient Address",
    placeholder: "Full address to which notice will be sent",
    type: "textarea",
    required: true,
    ragKey: "recipient_address",
  },
  {
    id: "notice_subject",
    label: "Subject of Notice",
    placeholder: "e.g. Recovery of Unpaid Rent, Return of Security Deposit",
    type: "text",
    required: true,
    ragKey: "notice_subject",
  },
  {
    id: "notice_type",
    label: "Type of Legal Notice",
    placeholder: "",
    type: "select",
    required: true,
    options: [
      { value: "unpaid_rent", label: "Unpaid Rent Recovery" },
      { value: "security_deposit", label: "Security Deposit Return" },
      { value: "property_dispute", label: "Property Dispute" },
      { value: "debt_recovery", label: "Debt / Loan Recovery" },
      { value: "breach_of_contract", label: "Breach of Contract" },
      { value: "defamation", label: "Defamation / Slander" },
      { value: "employment", label: "Employment / Wrongful Dismissal" },
      { value: "consumer_rights", label: "Consumer Rights Violation" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "facts_grievance",
    label: "Facts and Grievance",
    placeholder:
      "Describe the dispute: what was agreed, what went wrong, dates, amounts, prior communications...",
    type: "textarea",
    required: true,
    ragKey: "facts_grievance",
  },
  {
    id: "amount_claimed",
    label: "Amount Claimed (PKR)",
    placeholder: "e.g. 150,000",
    type: "text",
    required: false,
    hint: "If the dispute involves money, state the exact amount",
  },
  {
    id: "compliance_period",
    label: "Compliance Period (days)",
    placeholder: "e.g. 15",
    type: "text",
    required: true,
    hint: "Number of days given to comply before legal action",
  },
  {
    id: "legal_action",
    label: "Intended Legal Action if Not Complied",
    placeholder: "e.g. File civil suit, approach Consumer Court, file FIR...",
    type: "textarea",
    required: true,
    ragKey: "legal_action",
  },
];

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------
const applicationFields: DocumentField[] = [
  {
    id: "applicant_name",
    label: "Applicant Full Name",
    placeholder: "Your full name",
    type: "text",
    required: true,
    ragKey: "applicant_name",
  },
  {
    id: "applicant_address",
    label: "Applicant Address",
    placeholder: "Your full address",
    type: "textarea",
    required: true,
  },
  {
    id: "applicant_contact",
    label: "Contact Number / Email",
    placeholder: "Phone or email",
    type: "text",
    required: false,
  },
  {
    id: "addressee",
    label: "Addressed To (Title / Designation)",
    placeholder: "e.g. The Registrar, The Collector, The Commissioner",
    type: "text",
    required: true,
    ragKey: "addressee",
  },
  {
    id: "organisation",
    label: "Department / Organisation / Institution",
    placeholder: "e.g. University of Karachi, NADRA, District Administration",
    type: "text",
    required: true,
    ragKey: "organisation",
  },
  {
    id: "application_type",
    label: "Type of Application",
    placeholder: "",
    type: "select",
    required: true,
    options: [
      { value: "fee_refund", label: "Fee Refund" },
      { value: "service_complaint", label: "Service Complaint / Grievance" },
      { value: "document_request", label: "Document / Certificate Request" },
      { value: "leave", label: "Leave / Extension Request" },
      { value: "waiver", label: "Fine / Penalty Waiver" },
      { value: "admission", label: "Admission / Re-admission" },
      { value: "NOC", label: "NOC (No Objection Certificate)" },
      { value: "transfer", label: "Transfer / Migration" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "application_subject",
    label: "Subject of Application",
    placeholder: "e.g. Request for Fee Refund due to Medical Emergency",
    type: "text",
    required: true,
    ragKey: "application_subject",
  },
  {
    id: "details",
    label: "Details / Background",
    placeholder:
      "Explain your situation in detail: relevant facts, dates, reference numbers, what happened, why you are applying...",
    type: "textarea",
    required: true,
    hint: "Include roll numbers, case numbers, dates, or other reference information",
    ragKey: "details",
  },
  {
    id: "request",
    label: "Specific Request",
    placeholder: "Clearly state what you are requesting the authority to do",
    type: "textarea",
    required: true,
    ragKey: "request",
  },
  {
    id: "supporting_documents",
    label: "Supporting Documents",
    placeholder: "List documents attached: CNIC, receipts, medical reports, etc.",
    type: "textarea",
    required: false,
  },
];

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    type: "fir",
    label: "FIR (First Information Report)",
    description:
      "File a formal complaint with police for a cognisable offence — theft, assault, fraud, or other criminal matters.",
    icon: "🚨",
    color: "bg-red-50",
    fields: firFields,
    ragCategory: "criminal",
  },
  {
    type: "complaint",
    label: "Formal Complaint",
    description:
      "Submit a complaint to a regulatory body, consumer forum, labour court, or other authority.",
    icon: "📋",
    color: "bg-blue-50",
    fields: complaintFields,
    ragCategory: null,
  },
  {
    type: "legal_notice",
    label: "Legal Notice",
    description:
      "Send a formal legal notice demanding compliance — rent recovery, security deposit, contract breach.",
    icon: "📜",
    color: "bg-amber-50",
    fields: legalNoticeFields,
    ragCategory: "civil",
  },
  {
    type: "application",
    label: "Application",
    description:
      "Write a formal application to a government body, university, NADRA, or other institution.",
    icon: "📝",
    color: "bg-teal-50",
    fields: applicationFields,
    ragCategory: null,
  },
];

export function getTemplate(type: DocumentType): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.type === type);
}

export function getTemplateLabel(type: DocumentType): string {
  return getTemplate(type)?.label ?? type;
}
