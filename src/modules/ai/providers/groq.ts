import { AIError } from "../errors";
import type { AIProvider, CompleteJsonInput } from "./types";

const URL = "https://api.groq.com/openai/v1/chat/completions";

/** Pull the readable reason out of a Groq error body. */
function reasonOf(detail: string): string {
  try {
    const j = JSON.parse(detail);
    return String(j?.error?.message ?? detail).slice(0, 300);
  } catch {
    return detail.slice(0, 300);
  }
}

/** Models sometimes wrap JSON in fences or add text around it; keep the outermost object. */
function extractJson(text: string): string {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  return a >= 0 && b > a ? t.slice(a, b + 1) : t;
}

export class GroqProvider implements AIProvider {
  name = "groq";

  async completeJson({ system, user, maxTokens = 6000 }: CompleteJsonInput): Promise<string> {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new AIError("AI_NOT_CONFIGURED", "GROQ_API_KEY is missing from the server environment.");

    const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";
    const isReasoning = model.startsWith("openai/gpt-oss");

    const call = async (jsonMode: boolean): Promise<Response> => {
      try {
        return await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system + "\n\nReturn ONLY one valid JSON object. No markdown fences, no explanatory text." },
              { role: "user", content: user },
            ],
            temperature: 0.6,
            // gpt-oss "thinks" first and thinking counts against this limit, so keep it low and leave room.
            ...(isReasoning ? { reasoning_effort: "low", max_completion_tokens: Math.max(maxTokens, 8000) } : { max_tokens: maxTokens }),
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
          signal: AbortSignal.timeout(180_000),
        });
      } catch {
        throw new AIError("AI_UNAVAILABLE", "Could not connect to Groq. Check your internet connection and try again.");
      }
    };

    let res = await call(true);

    // 400 usually means JSON mode rejected the model's output (json_validate_failed) or the model
    // does not support it. Retry once without JSON mode; the prompt already demands JSON.
    if (res.status === 400) {
      const detail = await res.text().catch(() => "");
      console.error("Groq error 400 (retrying without JSON mode):", detail.slice(0, 500));
      res = await call(false);
      if (!res.ok) {
        const d2 = await res.text().catch(() => "");
        console.error("Groq error", res.status, d2.slice(0, 500));
        throw new AIError("AI_PROVIDER_ERROR", `Groq returned HTTP ${res.status}: ${reasonOf(d2 || detail)}`);
      }
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Groq error", res.status, detail.slice(0, 500));
      if (res.status === 401 || res.status === 403) throw new AIError("AI_NOT_CONFIGURED", "Groq API key was rejected. Check GROQ_API_KEY.");
      if (res.status === 429) throw new AIError("AI_UNAVAILABLE", "Groq rate limit or quota reached.");
      throw new AIError("AI_PROVIDER_ERROR", `Groq returned HTTP ${res.status}: ${reasonOf(detail)}`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new AIError("AI_BAD_OUTPUT", "Groq returned an empty response.");
    return extractJson(text);
  }
}
