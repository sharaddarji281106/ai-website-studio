import { AIError } from "../errors";
import type { AIProvider, CompleteJsonInput } from "./types";

/**
 * Talks to a local Ollama server. We stream the response so the HTTP connection never idles
 * (slow CPU-only machines can take minutes), and accumulate the JSON text.
 */
export class OllamaProvider implements AIProvider {
  name = "ollama";

  async completeJson({ system, user, maxTokens = 6000 }: CompleteJsonInput): Promise<string> {
    const base = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    const model = process.env.OLLAMA_MODEL ?? "llama3.1";

    // On a hosted server (e.g. Render), 127.0.0.1 is the server itself, not your computer.
    if (process.env.NODE_ENV === "production" && /^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)(:|\/|$)/i.test(base)) {
      throw new AIError(
        "AI_UNAVAILABLE",
        "AI is not reachable: OLLAMA_BASE_URL points to localhost on the server. Set it to a public Ollama URL (tunnel or GPU server).",
      );
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;

    let res: Response;
    try {
      res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          stream: true,
          format: "json",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          options: {
            temperature: 0.6,
            num_ctx: Number(process.env.OLLAMA_NUM_CTX ?? 16384),
            num_predict: maxTokens,
          },
        }),
        signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS ?? 600_000)),
      });
    } catch {
      throw new AIError(
        "AI_UNAVAILABLE",
        `Cannot reach Ollama at ${base}. Start it (run "ollama serve" or open the Ollama app) and make sure the model "${model}" is installed ("ollama pull ${model}").`,
      );
    }

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 404 || /not found/i.test(detail)) {
        throw new AIError("AI_UNAVAILABLE", `Ollama model "${model}" is not installed. Run: ollama pull ${model}`);
      }
      console.error("Ollama error", res.status, detail.slice(0, 300));
      throw new AIError("AI_PROVIDER_ERROR", String(res.status));
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";

    const consume = (line: string) => {
      if (!line.trim()) return;
      try {
        const obj = JSON.parse(line);
        if (obj.error) throw new AIError("AI_PROVIDER_ERROR", String(obj.error));
        content += obj.message?.content ?? "";
      } catch (e) {
        if (e instanceof AIError) throw e;
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        consume(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    consume(buffer);
    return content;
  }
}
