
import { AIError } from "../errors";
import { AnthropicProvider } from "./anthropic";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import type { AIProvider, CompleteJsonInput } from "./types";

class AutoProvider implements AIProvider {
  name = "auto";

  private providers: AIProvider[] = [
    new GeminiProvider(),
    new GroqProvider(),
  ];

  async completeJson(input: CompleteJsonInput): Promise<string> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        console.log(`[AI] Trying provider: ${provider.name}`);

        const result = await provider.completeJson(input);

        console.log(`[AI] Success with provider: ${provider.name}`);

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        console.error(`[AI] ${provider.name} failed:`, message);
        errors.push(`${provider.name}: ${message}`);
      }
    }

    throw new AIError(
      "AI_UNAVAILABLE",
      `All AI providers failed.\n${errors.join("\n")}`
    );
  }
}

const registry: Record<string, () => AIProvider> = {
  auto: () => new AutoProvider(),
  gemini: () => new GeminiProvider(),
  groq: () => new GroqProvider(),
  ollama: () => new OllamaProvider(),
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
};

export function getProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? "auto").toLowerCase().trim();
  const factory = registry[name];

  if (!factory) {
    throw new AIError(
      "AI_NOT_CONFIGURED",
      `Unknown AI provider: "${name}". Supported providers: auto, gemini, groq, ollama, openai, anthropic.`
    );
  }

  return factory();
}
