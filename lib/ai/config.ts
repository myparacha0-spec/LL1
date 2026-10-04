/**
 * Server-only AI configuration, read from environment variables at runtime.
 *
 * Never import this module (or any of its dependencies) from a Client
 * Component ΓÇö it reads secrets from `process.env`.
 */

export type EmbeddingProvider = "openai" | "openrouter";

export interface AiConfig {
  /** OpenRouter chat completions */
  openRouterApiKey: string | null;
  openRouterModel: string;
  /** Embeddings */
  embeddingProvider: EmbeddingProvider;
  embeddingApiKey: string | null;
  embeddingModel: string;
  embeddingDimensions: number;
  /** Optional override for the embeddings HTTP base URL (OpenAI-compatible). */
  embeddingBaseUrl: string | null;
  /** RAG retrieval knobs */
  maxRetrievedChunks: number;
  similarityThreshold: number;
  maxContextChunks: number;
  /** Max ~recent-message window sent to the LLM for follow-up context. */
  maxHistoryMessages: number;
}

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_THRESHOLD = 0.35;

function env(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

function numberEnv(name: string, fallback: number): number {
  const value = env(name);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const provider = (env("EMBEDDING_PROVIDER") ?? "openrouter").toLowerCase();

export function getAiConfig(): AiConfig {
  const embeddingProvider: EmbeddingProvider =
    provider === "openai" ? "openai" : "openrouter";

  const openRouterApiKey = env("OPENROUTER_API_KEY");
  const embeddingApiKey =
    env("EMBEDDING_API_KEY") ?? (embeddingProvider === "openrouter" ? openRouterApiKey : null);

  return {
    openRouterApiKey,
    openRouterModel: env("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL,
    embeddingProvider,
    embeddingApiKey,
    embeddingModel: env("EMBEDDING_MODEL") ?? DEFAULT_EMBEDDING_MODEL,
    embeddingDimensions: numberEnv("EMBEDDING_DIMENSIONS", DEFAULT_EMBEDDING_DIMENSIONS),
    embeddingBaseUrl: env("EMBEDDING_BASE_URL"),
    maxRetrievedChunks: numberEnv("LEGALEASE_MAX_RETRIEVED_CHUNKS", 8),
    similarityThreshold: numberEnv("LEGALEASE_SIMILARITY_THRESHOLD", DEFAULT_THRESHOLD),
    maxContextChunks: numberEnv("LEGALEASE_MAX_CONTEXT_CHUNKS", 6),
    maxHistoryMessages: numberEnv("LEGALEASE_MAX_HISTORY_MESSAGES", 8),
  };
}

export function embeddingsConfigError(): string | null {
  const cfg = getAiConfig();
  if (!cfg.embeddingApiKey) {
    return `No API key configured for the "${cfg.embeddingProvider}" embedding provider. Set ${
      cfg.embeddingProvider === "openrouter"
        ? "EMBEDDING_API_KEY (or reuse OPENROUTER_API_KEY)"
        : "EMBEDDING_API_KEY"
    } in your environment.`;
  }
  return null;
}

export function chatConfigError(): string | null {
  const cfg = getAiConfig();
  if (!cfg.openRouterApiKey) {
    return "OPENROUTER_API_KEY is not configured.";
  }
  return null;
}
