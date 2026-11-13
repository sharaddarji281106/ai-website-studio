import { AIError } from "../errors";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import type { AIProvider } from "./types";

const registry: Record<string, () => AIProvider> = {
  ollama: () => new OllamaProvider(),
  openai: () => new OpenAIProvider(),
};

export function getProvider(): AIProvider {
  const name = process.env.AI_PROVIDER ?? "ollama";
  const factory = registry[name];
  if (!factory) throw new AIError("AI_NOT_CONFIGURED", `Unknown AI provider: ${name}`);
  return factory();
}
