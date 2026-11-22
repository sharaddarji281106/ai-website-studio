
import { AIError } from "../errors";
import type { AIProvider, CompleteJsonInput } from "./types";

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async completeJson({
    system,
    user,
    maxTokens = 6000,
  }: CompleteJsonInput): Promise<string> {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      throw new AIError(
        "AI_NOT_CONFIGURED",
        "GEMINI_API_KEY is missing from the server environment."
      );
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    let res: Response;

    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: system }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: user }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: maxTokens,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(180_000),
        }
      );
    } catch {
      throw new AIError(
        "AI_UNAVAILABLE",
        "Could not connect to Gemini. Check your internet connection and try again."
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Gemini error", res.status, detail.slice(0, 500));

      if (res.status === 401 || res.status === 403) {
        throw new AIError(
          "AI_NOT_CONFIGURED",
          "Gemini API key was rejected. Check GEMINI_API_KEY."
        );
      }

      if (res.status === 429) {
        throw new AIError(
          "AI_UNAVAILABLE",
          "Gemini quota exceeded or rate limit reached."
        );
      }

      throw new AIError("AI_PROVIDER_ERROR", `Gemini returned HTTP ${res.status}`);
    }

    const data = await res.json();

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";

    if (!text.trim()) {
      throw new AIError("AI_BAD_OUTPUT", "Gemini returned an empty response.");
    }

    return text.trim();
  }
}
