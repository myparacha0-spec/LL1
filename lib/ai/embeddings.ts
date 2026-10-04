/**
 * Embedding provider abstraction.
 *
 * The provider (openai / openrouter) uses the OpenAI-compatible `/embeddings`
 * HTTP API, so no SDK is required and the endpoint can be pointed at any
 * compatible service via EMBEDDING_BASE_URL. Server-side only ΓÇö API keys are
 * read from `process.env` and are never exposed to the browser.
 */

import {
  getAiConfig,
  type AiConfig,
  type EmbeddingProvider,
} from "@/lib/ai/config";

export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "config"
      | "http"
      | "rate_limit"
      | "dimension_mismatch"
      | "provider" = "provider"
  ) {
    super(message);
    this.name = "EmbeddingError";
  }
}

const DEFAULT_BASE_URL: Record<EmbeddingProvider, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

// Small hard cap so one request does not blow context limits. Callers batch
// their chunks into groups; the last partial group is sent as-is.
export const EMBEDDING_BATCH_SIZE = 16;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw new EmbeddingError(
    `Embedding request failed after ${attempts} attempts: ${lastError?.message ?? "unknown error"}`,
    "http"
  );
}

function assertDimensions(vector: number[], cfg: AiConfig): void {
  if (cfg.embeddingDimensions > 0 && vector.length !== cfg.embeddingDimensions) {
    throw new EmbeddingError(
      `Embedding dimension mismatch: model "${cfg.embeddingModel}" returned ${vector.length} dimensions but EMBEDDING_DIMENSIONS is ${cfg.embeddingDimensions}. Update EMBEDDING_DIMENSIONS (and the legal_chunks.embedding vector(n) column in supabase/migrations) to match.`,
      "dimension_mismatch"
    );
  }
}

async function callEmbeddings(
  texts: string[],
  cfg: AiConfig
): Promise<number[][]> {
  const baseUrl = cfg.embeddingBaseUrl ?? DEFAULT_BASE_URL[cfg.embeddingProvider];
  const url = `${baseUrl.replace(/\/$/, "")}/embeddings`;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.embeddingApiKey}`,
    },
    body: JSON.stringify({
      model: cfg.embeddingModel,
      input: texts,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? "";
    } catch {
      /* ignore body parse errors */
    }
    if (res.status === 429) {
      throw new EmbeddingError(
        `Embedding provider rate limited: ${detail || res.statusText}`,
        "rate_limit"
      );
    }
    throw new EmbeddingError(
      `Embedding provider error (${res.status}): ${detail || res.statusText}`,
      res.status >= 500 ? "provider" : "http"
    );
  }

  const body = (await res.json()) as { data?: { embedding?: number[] }[] };
  if (!body.data || !Array.isArray(body.data)) {
    throw new EmbeddingError("Embedding provider returned an unexpected payload.", "provider");
  }

  return body.data.map((item) => {
    const vector = item.embedding ?? [];
    assertDimensions(vector, cfg);
    return vector;
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const clean = text.trim();
  if (!clean) throw new EmbeddingError("Cannot embed an empty string.", "config");

  const [vector] = await generateEmbeddings([clean]);
  return vector;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cfg = getAiConfig();
  if (!cfg.embeddingApiKey) {
    throw new EmbeddingError(
      `No embedding API key configured (provider="${cfg.embeddingProvider}"). Set EMBEDDING_API_KEY or OPENROUTER_API_KEY.`,
      "config"
    );
  }

  const cleanTexts = texts.map((t) => t.trim()).filter((t) => t.length > 0);
  const results: number[][] = [];

  for (let i = 0; i < cleanTexts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = cleanTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
    results.push(...(await callEmbeddings(batch, cfg)));
  }

  if (results.length === 0) {
    throw new EmbeddingError("No texts provided for embedding.", "config");
  }
  return results;
}
