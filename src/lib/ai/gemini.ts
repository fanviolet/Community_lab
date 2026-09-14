const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  json?: boolean;
  /** Defaults to MINIMAL so thinking tokens do not exhaust maxOutputTokens. */
  thinkingLevel?: "MINIMAL" | "LOW" | "MEDIUM" | "HIGH";
}

export type GeminiGenerateResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  return key && key.trim() ? key.trim() : null;
}

export async function generateGeminiText(
  options: GeminiGenerateOptions,
): Promise<GeminiGenerateResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      thinkingConfig: {
        thinkingLevel: options.thinkingLevel ?? "MINIMAL",
      },
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorMessage = await readGeminiErrorMessage(response);
    return {
      ok: false,
      status: 502,
      error: `Gemini request failed: ${errorMessage}`,
    };
  }

  const payload = await response.json().catch(() => null);
  const text = extractTextFromGeminiResponse(payload);
  const finishReason = extractFinishReason(payload);

  if (!text) {
    return {
      ok: false,
      status: 502,
      error:
        finishReason === "MAX_TOKENS"
          ? "Gemini ran out of output tokens before returning content. Try again or increase maxOutputTokens."
          : `Gemini returned empty content${finishReason ? ` (finishReason=${finishReason})` : ""}.`,
    };
  }

  if (finishReason === "MAX_TOKENS") {
    return {
      ok: false,
      status: 502,
      error: "Gemini response was truncated (MAX_TOKENS). Try again.",
    };
  }

  return { ok: true, text };
}

async function readGeminiErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; status?: string };
    };
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // fall through to raw/status text
  }

  return raw || response.statusText || `HTTP ${response.status}`;
}

function extractFinishReason(responseBody: unknown): string | null {
  if (typeof responseBody !== "object" || responseBody === null) {
    return null;
  }

  const candidates = (responseBody as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const finishReason = (candidates[0] as Record<string, unknown>).finishReason;
  return typeof finishReason === "string" ? finishReason : null;
}

function extractTextFromGeminiResponse(responseBody: unknown): string | null {
  if (typeof responseBody !== "object" || responseBody === null) {
    return null;
  }

  const candidates = (responseBody as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const content = (candidates[0] as Record<string, unknown>).content;
  if (typeof content !== "object" || content === null) {
    return null;
  }

  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }

  const text = parts
    .map((part) => {
      if (typeof part !== "object" || part === null) return "";
      const record = part as Record<string, unknown>;
      // Skip thought-only parts if the API ever surfaces them as text parts.
      if (record.thought === true) return "";
      const value = record.text;
      return typeof value === "string" ? value : "";
    })
    .join("")
    .trim();

  return text || null;
}
