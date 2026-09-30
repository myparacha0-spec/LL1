import { createClient } from "@/lib/supabase/server";

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface LegalResource {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  law_name: string | null;
  section_reference: string | null;
  jurisdiction: string;
  keywords: string[];
  source_name: string;
  source_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  category?: ResourceCategory | null;
}

export interface ResourceFilters {
  search?: string;
  category?: string;
  jurisdiction?: string;
}

const resourceSelect = `
  id,
  category_id,
  title,
  slug,
  summary,
  content,
  law_name,
  section_reference,
  jurisdiction,
  keywords,
  source_name,
  source_url,
  published,
  created_at,
  updated_at,
  category:legal_resource_categories (
    id,
    name,
    slug,
    description,
    created_at
  )
`;

function cleanSearchTerms(value: string): string[] {
  return value
    .trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100)
    .split(" ")
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 2)
    .slice(0, 8);
}

function cleanFilterValue(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}




export async function getResourceCategories(): Promise<ResourceCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("legal_resource_categories")
    .select("id, name, slug, description, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load resource categories: ${error.message}`,
    );
  }

  return data ?? [];
}

export async function getResourceJurisdictions(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("legal_resources")
    .select("jurisdiction")
    .eq("published", true);

  if (error) {
    throw new Error(
      `Failed to load jurisdictions: ${error.message}`,
    );
  }

  const jurisdictions = new Set(
    (data ?? [])
      .map((item) => item.jurisdiction)
      .filter(
        (jurisdiction): jurisdiction is string =>
          typeof jurisdiction === "string" &&
          jurisdiction.trim().length > 0,
      ),
  );

  return Array.from(jurisdictions).sort();
}

export async function getPublishedResources(
  filters: ResourceFilters = {},
): Promise<LegalResource[]> {
  const supabase = await createClient();

  const categorySlug = cleanFilterValue(filters.category);
  const jurisdiction = cleanFilterValue(filters.jurisdiction);
  const search = cleanFilterValue(filters.search);

  let categoryId: string | null = null;

  /*
   * IMPORTANT:
   * The URL uses a category SLUG such as "family-law".
   * The legal_resources.category_id column requires a UUID.
   *
   * So we ALWAYS convert:
   *
   * family-law
   *      ↓
   * category table
   *      ↓
   * UUID
   *
   * before filtering legal_resources.
   */
  if (categorySlug) {
    const { data: category, error: categoryError } = await supabase
      .from("legal_resource_categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (categoryError) {
      throw new Error(
        `Failed to resolve resource category: ${categoryError.message}`,
      );
    }

    if (!category?.id) {
      return [];
    }

    categoryId = category.id;

   
  }

  let query = supabase
    .from("legal_resources")
    .select(resourceSelect)
    .eq("published", true)
    .order("updated_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (jurisdiction) {
    query = query.eq("jurisdiction", jurisdiction);
  }

  const searchTerms = search ? cleanSearchTerms(search) : [];

  if (searchTerms.length > 0) {
    const searchConditions: string[] = [];

    for (const term of searchTerms) {
      searchConditions.push(`title.ilike.%${term}%`);
      searchConditions.push(`summary.ilike.%${term}%`);
      searchConditions.push(`law_name.ilike.%${term}%`);
      searchConditions.push(`section_reference.ilike.%${term}%`);
      searchConditions.push(`keywords.cs.{${term}}`);
    }

    query = query.or(searchConditions.join(","));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to load legal resources: ${error.message}`,
    );
  }

  return (data ?? []) as unknown as LegalResource[];
}

export async function getPublishedResourceBySlug(
  slug: string,
): Promise<LegalResource | null> {
  const supabase = await createClient();

  const cleanSlug = slug.trim();

  const { data, error } = await supabase
    .from("legal_resources")
    .select(resourceSelect)
    .eq("slug", cleanSlug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load legal resource: ${error.message}`,
    );
  }

  return data as unknown as LegalResource | null;
}

export async function getRelatedPublishedResources(
  resource: LegalResource,
  limit = 3,
): Promise<LegalResource[]> {
  const supabase = await createClient();

 

  const { data, error } = await supabase
    .from("legal_resources")
    .select(resourceSelect)
    .eq("published", true)
    .eq("category_id", resource.category_id)
    .neq("id", resource.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Failed to load related legal resources: ${error.message}`,
    );
  }

  return (data ?? []) as unknown as LegalResource[];
}