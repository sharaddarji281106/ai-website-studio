
import { AIError } from "../errors";
import type { AIProvider, CompleteJsonInput } from "./types";

export class GroqProvider implements AIProvider {
  name = "groq";

  async completeJson({
    system,
    user,
    maxTokens = 6000,
  }: CompleteJsonInput): Promise<string> {
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      throw new AIError(
        "AI_NOT_CONFIGURED",
        "GROQ_API_KEY is missing from the server environment."
      );
    }

    const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

    let res: Response;

    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                system +
                "\n\nReturn ONLY valid JSON. Do not use markdown fences or explanatory text.",
            },
            {
              role: "user",
              content: user,
            },
          ],
          temperature: 0.6,
          max_tokens: maxTokens,
          response_format: {
            type: "json_object",
          },
        }),
        signal: AbortSignal.timeout(180_000),
      });
    } catch {
      throw new AIError(
        "AI_UNAVAILABLE",
        "Could not connect to Groq. Check your internet connection and try again."
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Groq error", res.status, detail.slice(0, 500));

      if (res.status === 401 || res.status === 403) {
        throw new AIError(
          "AI_NOT_CONFIGURED",
          "Groq API key was rejected. Check GROQ_API_KEY."
        );
      }

      if (res.status === 429) {
        throw new AIError(
          "AI_UNAVAILABLE",
          "Groq rate limit or quota reached."
        );
      }

      throw new AIError("AI_PROVIDER_ERROR", `Groq returned HTTP ${res.status}`);
    }

    const data = await res.json();

    const text = data?.choices?.[0]?.message?.content ?? "";

    if (!text.trim()) {
      throw new AIError("AI_BAD_OUTPUT", "Groq returned an empty response.");
    }

    return text.trim();
  }
}
