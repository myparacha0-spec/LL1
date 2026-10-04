/**
 * Rule-based query classification. Classification is a retrieval *hint* ΓÇö if
 * confidence is low the retriever falls back to a broader search. A wrong
 * classifier can never exclude all potentially relevant sources, because a
 * low-confidence query treats every category as eligible.
 */

import type { LegalCategory } from "@/lib/rag/document-catalog";

export interface QueryClassification {
  category: LegalCategory | null;
  jurisdictionLevel: "Federal" | "Provincial" | "Local" | null;
  province: string | null;
  city: string | null;
  intent: string | null;
  confidence: "high" | "medium" | "low";
  matchedKeywords: string[];
}

interface CategoryRule {
  category: LegalCategory;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "rent_tenancy",
    keywords: [
      "landlord", "tenant", "rent", "evict", "tenancy", "lease", "premises",
      "security deposit", "rented", "occupancy", "kabza", "lease",
    ],
  },
  {
    category: "family",
    keywords: [
      "divorce", "khula", "talaq", "nikah", "marriage", "maintenance", "custody",
      "child", "guardian", "dower", "mahr", "mehr", "family court", "alimony",
    ],
  },
  {
    category: "criminal",
    keywords: [
      "theft", "robbery", "murder", "assault", "bail", "arrest", "crime",
      "criminal", "offence", "fir", "detention", "kidnapping", "homicide",
      "dacoity", "snatching", "fraud", "cheating", "threat",
    ],
  },
  {
    category: "cybercrime",
    keywords: [
      "hack", "cyber", "online fraud", "digital", "social media", "identity theft",
      "phishing", "internet crime", "hacking", "defamation online", "peca",
    ],
  },
  {
    category: "consumer",
    keywords: [
      "consumer", "refund", "defective product", "warranty", "false advertisement",
      "deceptive", "charging", "price hike", "unfair trade", "consumer court",
    ],
  },
  {
    category: "employment_labour",
    keywords: [
      "salary", "wages", "employer", "termination", "fired", "layoff", "notice",
      "working hours", "overtime", "dismissal", "labour", "employment", "shop",
      "industrial", "gratuity", "lay-offs", "standing orders",
    ],
  },
  {
    category: "contract",
    keywords: [
      "contract", "agreement", "breach", "specific performance", "consideration",
      "parties", "penalty clause", "liquidated damages", "indemnity", "sale of goods",
    ],
  },
  {
    category: "property",
    keywords: [
      "property", "land", "plot", "house purchase", "transfer of property",
      "ownership", "inheritance property", "real estate", "sale deed", "possession",
    ],
  },
  {
    category: "registration",
    keywords: [
      "registration", "registered document", "registry", "stamp duty", "mutation",
      "fard", "tamlikat", "attestation",
    ],
  },
  {
    category: "civil_procedure",
    keywords: [
      "suit", "civil court", "plaint", "summons", "injunction", "decree",
      "execution", "civil", "court of first instance", "appeal civil",
    ],
  },
  {
    category: "criminal_procedure",
    keywords: [
      "fir", "first information", "search warrant", "remand", "charge sheet",
      "trial", "cognizance", "police investigation", "arraignment", "criminal procedure",
    ],
  },
  {
    category: "evidence",
    keywords: [
      "evidence", "witness", "proof", "qanun", "shahadat", "documentary evidence",
      "testimony", "cross-examination", "presumption",
    ],
  },
  {
    category: "constitutional",
    keywords: [
      "constitution", "fundamental right", "article", "fundamental rights",
      "writ", "supreme court", "high court", "human rights", "equality before law",
    ],
  },
];

const JURISDICTION_KEYWORDS: { label: "Federal" | "Provincial" | "Local"; keywords: string[] }[] = [
  { label: "Local", keywords: ["karachi" ] },
  { label: "Provincial", keywords: ["sindh"] },
  { label: "Federal", keywords: ["federal", "pakistan", "countrywide", "constitution", "parliament"] },
];

const INTENT_RULES: { intent: string; keywords: string[] }[] = [
  { intent: "eviction / tenancy dispute", keywords: ["evict", "vacate", "leave", "landlord", "rent"] },
  { intent: "criminal complaint / FIR", keywords: ["fir", "report", "complain", "police", "arrest"] },
  { intent: "theft / property offence", keywords: ["theft", "stolen", "steal"] },
  { intent: "contract dispute", keywords: ["breach", "contract", "agreement"] },
  { intent: "family / divorce", keywords: ["divorce", "khula", "talaq", "custody"] },
  { intent: "consumer complaint", keywords: ["refund", "defective", "consumer"] },
  { intent: "employment dispute", keywords: ["salary", "fired", "terminate", "notice", "employer"] },
  { intent: "cybercrime complaint", keywords: ["hack", "cyber", "online"] },
];

export function classifyQuery(question: string): QueryClassification {
  const lower = question.toLowerCase();
  const matchedKeywords: string[] = [];

  let category: LegalCategory | null = null;
  let bestMatches = 0;
  for (const rule of CATEGORY_RULES) {
    const hits = rule.keywords.filter((k) => lower.includes(k));
    if (hits.length > bestMatches) {
      bestMatches = hits.length;
      category = rule.category;
      matchedKeywords.length = 0;
      matchedKeywords.push(...hits);
    }
  }

  let jurisdictionLevel: QueryClassification["jurisdictionLevel"] = null;
  let province: string | null = null;
  let city: string | null = null;
  if (/karachi/i.test(lower)) city = "Karachi";
  if (/sindh/i.test(lower)) {
    province = "Sindh";
    jurisdictionLevel = "Provincial";
  }
  // Karachi is in Sindh; a Karachi-specific mention is still a Sindh (province)
  // jurisdiction at minimum.
  if (!jurisdictionLevel && city === "Karachi") {
    jurisdictionLevel = "Provincial";
    province = "Sindh";
  }
  if (!jurisdictionLevel) {
    for (const rule of JURISDICTION_KEYWORDS) {
      if (rule.keywords.some((k) => lower.includes(k))) {
        jurisdictionLevel = rule.label;
        break;
      }
    }
  }

  let intent: string | null = null;
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      intent = rule.intent;
      break;
    }
  }

  const confidence: QueryClassification["confidence"] =
    bestMatches >= 3 ? "high" : bestMatches >= 1 ? "medium" : "low";

  return {
    category,
    jurisdictionLevel,
    province,
    city,
    intent,
    confidence,
    matchedKeywords,
  };
}
