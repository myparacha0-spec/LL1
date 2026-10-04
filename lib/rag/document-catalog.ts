/**
 * Known-law catalog used to classify legal PDFs without relying on an LLM.
 *
 * Each entry matches against a filename / extracted-title via a regex and
 * provides deterministic metadata. Classifier confidence increases when a
 * catalog entry matches; documents with no match fall back to keyword heuristics
 * (category "other").
 */

export type LegalCategory =
  | "constitutional"
  | "criminal"
  | "criminal_procedure"
  | "civil_procedure"
  | "evidence"
  | "contract"
  | "family"
  | "property"
  | "rent_tenancy"
  | "consumer"
  | "employment_labour"
  | "cybercrime"
  | "registration"
  | "other";

export const LEGAL_CATEGORY_LABELS: Record<LegalCategory, string> = {
  constitutional: "Constitutional",
  criminal: "Criminal",
  criminal_procedure: "Criminal procedure",
  civil_procedure: "Civil procedure",
  evidence: "Evidence",
  contract: "Contract",
  family: "Family",
  property: "Property",
  rent_tenancy: "Rent & tenancy",
  consumer: "Consumer",
  employment_labour: "Employment & labour",
  cybercrime: "Cybercrime",
  registration: "Registration",
  other: "Other",
};

export const LEGAL_CATEGORIES = Object.keys(
  LEGAL_CATEGORY_LABELS
) as LegalCategory[];

export interface LawCatalogEntry {
  /** Regex tested against filename + extracted title (case-insensitive). */
  pattern: RegExp;
  title: string;
  normalizedTitle: string;
  shortTitle: string | null;
  documentType: "constitution" | "code" | "statute" | "ordinance" | "rules";
  category: LegalCategory;
  jurisdictionLevel: "Federal" | "Provincial";
  province: string | null;
  year: number | null;
  sourceAuthority: string | null;
}

export const LAW_CATALOG: LawCatalogEntry[] = [
  {
    pattern: /constitution.*pakistan|pakistan.*constitution/i,
    title: "Constitution of the Islamic Republic of Pakistan, 1973",
    normalizedTitle: "constitution-of-pakistan",
    shortTitle: "Constitution of Pakistan",
    documentType: "constitution",
    category: "constitutional",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1973,
    sourceAuthority: "National Assembly of Pakistan",
  },
  {
    pattern: /pakistan penal code|penal code|ppc/i,
    title: "Pakistan Penal Code, 1860",
    normalizedTitle: "pakistan-penal-code",
    shortTitle: "Pakistan Penal Code",
    documentType: "code",
    category: "criminal",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1860,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /code of criminal procedure|crpc|criminal procedure code/i,
    title: "Code of Criminal Procedure, 1898",
    normalizedTitle: "code-of-criminal-procedure",
    shortTitle: "Code of Criminal Procedure",
    documentType: "code",
    category: "criminal_procedure",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1898,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /code of civil procedure|cpc|civil procedure code/i,
    title: "Code of Civil Procedure, 1908",
    normalizedTitle: "code-of-civil-procedure",
    shortTitle: "Code of Civil Procedure",
    documentType: "code",
    category: "civil_procedure",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1908,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /qanun[-\s]?e[-\s]?shahadat|qanun e shahadat|law of evidence|evidence act/i,
    title: "Qanun-e-Shahadat (Order X of 1984), 1984",
    normalizedTitle: "qanun-e-shahadat",
    shortTitle: "Qanun-e-Shahadat",
    documentType: "statute",
    category: "evidence",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1984,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /contract act/i,
    title: "Contract Act, 1872",
    normalizedTitle: "contract-act",
    shortTitle: "Contract Act",
    documentType: "statute",
    category: "contract",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1872,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /muslim family laws ordinance/i,
    title: "Muslim Family Laws Ordinance, 1961",
    normalizedTitle: "muslim-family-laws-ordinance",
    shortTitle: "Muslim Family Laws Ordinance",
    documentType: "ordinance",
    category: "family",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1961,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /dissolution of muslim marriages act/i,
    title: "Dissolution of Muslim Marriages Act, 1939",
    normalizedTitle: "dissolution-of-muslim-marriages-act",
    shortTitle: "Dissolution of Muslim Marriages Act",
    documentType: "statute",
    category: "family",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1939,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /family courts act/i,
    title: "West Pakistan Family Courts Act, 1964",
    normalizedTitle: "west-pakistan-family-courts-act",
    shortTitle: "Family Courts Act",
    documentType: "statute",
    category: "family",
    jurisdictionLevel: "Provincial",
    province: "Sindh",
    year: 1964,
    sourceAuthority: "Provincial Legislature (West Pakistan)",
  },
  {
    pattern: /rented premises ordinance|rent.*ordinance/i,
    title: "Sindh Rented Premises Ordinance, 1979",
    normalizedTitle: "sindh-rented-premises-ordinance",
    shortTitle: "Sindh Rented Premises Ordinance",
    documentType: "ordinance",
    category: "rent_tenancy",
    jurisdictionLevel: "Provincial",
    province: "Sindh",
    year: 1979,
    sourceAuthority: "Government of Sindh",
  },
  {
    pattern: /consumer protection act/i,
    title: "Sindh Consumer Protection Act, 2014",
    normalizedTitle: "sindh-consumer-protection-act",
    shortTitle: "Sindh Consumer Protection Act",
    documentType: "statute",
    category: "consumer",
    jurisdictionLevel: "Provincial",
    province: "Sindh",
    year: 2014,
    sourceAuthority: "Government of Sindh",
  },
  {
    pattern: /standing orders|terms of employment/i,
    title: "Sindh Terms of Employment (Standing Orders) Act, 2015",
    normalizedTitle: "sindh-terms-of-employment-standing-orders-act",
    shortTitle: "Sindh Standing Orders Act",
    documentType: "statute",
    category: "employment_labour",
    jurisdictionLevel: "Provincial",
    province: "Sindh",
    year: 2015,
    sourceAuthority: "Government of Sindh",
  },
  {
    pattern: /shops and commercial establishment|shops.*establishment/i,
    title: "Sindh Shops and Commercial Establishments Act, 2015",
    normalizedTitle: "sindh-shops-and-commercial-establishments-act",
    shortTitle: "Sindh Shops Act",
    documentType: "statute",
    category: "employment_labour",
    jurisdictionLevel: "Provincial",
    province: "Sindh",
    year: 2015,
    sourceAuthority: "Government of Sindh",
  },
  {
    pattern: /prevention of electronic crimes|peca/i,
    title: "Prevention of Electronic Crimes Act, 2016",
    normalizedTitle: "prevention-of-electronic-crimes-act",
    shortTitle: "Prevention of Electronic Crimes Act",
    documentType: "statute",
    category: "cybercrime",
    jurisdictionLevel: "Federal",
    province: null,
    year: 2016,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /registration act/i,
    title: "Registration Act, 1908",
    normalizedTitle: "registration-act",
    shortTitle: "Registration Act",
    documentType: "statute",
    category: "registration",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1908,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /transfer of property act/i,
    title: "Transfer of Property Act, 1882",
    normalizedTitle: "transfer-of-property-act",
    shortTitle: "Transfer of Property Act",
    documentType: "statute",
    category: "property",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1882,
    sourceAuthority: "Federal Legislature",
  },
  {
    pattern: /specific relief act/i,
    title: "Specific Relief Act, 1877",
    normalizedTitle: "specific-relief-act",
    shortTitle: "Specific Relief Act",
    documentType: "statute",
    category: "contract",
    jurisdictionLevel: "Federal",
    province: null,
    year: 1877,
    sourceAuthority: "Federal Legislature",
  },
];

export interface ClassifiedLaw {
  cataloged: boolean;
  title: string;
  normalizedTitle: string;
  shortTitle: string | null;
  documentType: Exclude<LawCatalogEntry["documentType"], undefined>;
  category: LegalCategory;
  jurisdictionLevel: "Federal" | "Provincial" | "Local";
  province: string | null;
  year: number | null;
  sourceAuthority: string | null;
}

/** Rule-based classification from a filename (and optionally extracted first-page text). */
export function classifyDocument(filename: string): ClassifiedLaw {
  const source = filename;
  const match = LAW_CATALOG.find((entry) => entry.pattern.test(source));
  if (match) {
    return {
      cataloged: true,
      title: match.title,
      normalizedTitle: match.normalizedTitle,
      shortTitle: match.shortTitle,
      documentType: match.documentType,
      category: match.category,
      jurisdictionLevel: match.jurisdictionLevel,
      province: match.province,
      year: match.year,
      sourceAuthority: match.sourceAuthority,
    };
  }

  // Keyword fallbacks for laws that are not in the catalog yet.
  const lower = filename.toLowerCase();
  const category: LegalCategory = /rent|tenant|evict/i.test(lower)
    ? "rent_tenancy"
    : /consumer/i.test(lower)
      ? "consumer"
      : /labour|employment|shop|standing order|wages|industrial/i.test(lower)
        ? "employment_labour"
        : /cyber|electronic/i.test(lower)
          ? "cybercrime"
          : /criminal|penal|offence/i.test(lower)
            ? "criminal"
            : /procedure/i.test(lower)
              ? "civil_procedure"
              : "other";

  const normalized = slugify(stripExtension(cleanTitle(filename)));
  return {
    cataloged: false,
    title: stripExtension(cleanTitle(filename)),
    normalizedTitle: normalized,
    shortTitle: null,
    documentType: /ordinance/i.test(lower)
      ? "ordinance"
      : /regulation|rules/i.test(lower)
        ? "rules"
        : "statute",
    category,
    jurisdictionLevel: /sindh|karachi/i.test(lower) ? "Provincial" : "Federal",
    province: /sindh/i.test(lower) ? "Sindh" : null,
    year: extractYear(filename) ?? null,
    sourceAuthority: null,
  };
}

// --- helpers ----------------------------------------------------------------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['ΓÇÖ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripExtension(filename: string): string {
  return filename.replace(/\.(pdf|txt|md|markdown)$/i, "");
}

export function cleanTitle(filename: string): string {
  return stripExtension(filename).replace(/[_-]+/g, " ").trim();
}

export function extractYear(filename: string): number | null {
  const matches = filename.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  if (!matches) return null;
  const year = Number(matches[0]);
  return year >= 1800 && year <= 2100 ? year : null;
}

/** Try to derive sexagesimal section letters like "378-A". */
export function extractVersionLabel(filename: string): string | null {
  // e.g. "as amended 2017", "amended 2019", "(2017)", "2017 edition"
  const amended = filename.match(/amend(?:ed|ment)?[^0-9]{0,6}(year\s+)?(1[5-9]\d{2}|20\d{2})/i);
  if (amended) return `Amended ${amended[2]}`;
  const year = extractYear(filename);
  if (year) return `${year} edition`;
  return null;
}
