import { AIError } from "../errors";
import type { AIProvider, CompleteJsonInput } from "./types";

/** Pulls the JSON object out of a reply, even if the model wrapped it in ``` fences or added a sentence. */
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text.trim();
}

/** Claude via the Anthropic Messages API. Works from any host (e.g. Render): no local GPU needed. */
export class AnthropicProvider implements AIProvider {
  name = "anthropic";

  async completeJson({ system, user, maxTokens = 6000 }: CompleteJsonInput): Promise<string> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new AIError("AI_NOT_CONFIGURED", "ANTHROPIC_API_KEY is not set on the server.");

    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
          max_tokens: maxTokens,
          system: `${system}\n\nReturn ONLY one valid JSON object. No markdown fences and no text before or after it.`,
          messages: [{ role: "user", content: user }],
        }),
        signal: AbortSignal.timeout(180_000),
      });
    } catch {
      throw new AIError("AI_UNAVAILABLE", "Could not reach the Claude API. Please try again.");
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Anthropic error", res.status, detail.slice(0, 300));
      if (res.status === 401 || res.status === 403) throw new AIError("AI_NOT_CONFIGURED", "The Claude API key was rejected. Check ANTHROPIC_API_KEY.");
      if (res.status === 429 || res.status === 529) throw new AIError("AI_UNAVAILABLE", "Claude is busy right now. Please try again in a moment.");
      throw new AIError("AI_PROVIDER_ERROR", String(res.status));
    }

    const data = await res.json();
    if (data?.stop_reason === "max_tokens") throw new AIError("AI_BAD_OUTPUT", "The reply was cut off (increase AI_MAX_OUTPUT_TOKENS).");
    const text = (data?.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    return extractJson(text);
  }
}
