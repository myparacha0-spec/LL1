/**
 * OpenRouter chat-completions abstraction. Server-side only ΓÇö OPENROUTER_API_KEY
 * is read from `process.env` and never exposed to the browser.
 */

import { getAiConfig } from "@/lib/ai/config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  /** Request `response_format: { type: "json_object" }` when supported. */
  jsonObject?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "config"
      | "http"
      | "rate_limit"
      | "timeout"
      | "empty" = "http"
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

async function postChat(
  messages: ChatMessage[],
  jsonObject: boolean,
  maxTokens: number,
  temperature: number,
  timeoutMs: number
) {
  const cfg = getAiConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const payload: Record<string, unknown> = {
    model: cfg.openRouterModel,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (jsonObject) payload.response_format = { type: "json_object" };

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.openRouterApiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        detail = body.error?.message ?? "";
      } catch {
        /* ignore */
      }
      if (res.status === 401) {
        throw new OpenRouterError(
          "OpenRouter rejected the API key (401).",
          "config"
        );
      }
      if (res.status === 429) {
        throw new OpenRouterError(
          `OpenRouter rate limited: ${detail || res.statusText}`,
          "rate_limit"
        );
      }
      throw new OpenRouterError(
        `OpenRouter error (${res.status}): ${detail || res.statusText}`,
        res.status >= 500 ? "http" : "http"
      );
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      throw new OpenRouterError(
        "OpenRouter returned an empty completion.",
        "empty"
      );
    }
    return content.trim();
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    const aborted =
      err instanceof Error && err.name === "AbortError";
    throw new OpenRouterError(
      aborted
        ? `OpenRouter request timed out after ${timeoutMs}ms.`
        : `OpenRouter request failed: ${err instanceof Error ? err.message : String(err)}`,
      aborted ? "timeout" : "http"
    );
  } finally {
    clearTimeout(timeout);
  }
}

export interface ChatCompletionResult {
  content: string;
  model: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const cfg = getAiConfig();
  if (!cfg.openRouterApiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not configured.",
      "config"
    );
  }

  const maxTokens = options.maxTokens ?? 1200;
  const temperature = options.temperature ?? 0.2;
  const timeoutMs = 90_000;

  // First attempt with JSON response mode. If the model/provider rejects
  // `response_format` (not all do), retry without it.
  try {
    const content = await postChat(
      messages,
      Boolean(options.jsonObject),
      maxTokens,
      temperature,
      timeoutMs
    );
    return { content, model: cfg.openRouterModel };
  } catch (err) {
    if (options.jsonObject && err instanceof OpenRouterError && err.kind === "http") {
      const content = await postChat(messages, false, maxTokens, temperature, timeoutMs);
      return { content, model: cfg.openRouterModel };
    }
    throw err;
  }
}
