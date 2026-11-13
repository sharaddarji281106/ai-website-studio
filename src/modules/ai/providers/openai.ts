import { AIError } from "../errors";
import type { AIProvider, CompleteJsonInput } from "./types";

export class OpenAIProvider implements AIProvider {
  name = "openai";

  async completeJson({ system, user, maxTokens = 6000 }: CompleteJsonInput): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new AIError("AI_NOT_CONFIGURED");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("OpenAI error", res.status, detail.slice(0, 300));
      throw new AIError("AI_PROVIDER_ERROR", String(res.status));
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }
}
