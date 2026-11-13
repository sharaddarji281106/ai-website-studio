export interface CompleteJsonInput {
  system: string;
  user: string;
  maxTokens?: number;
}

/** Every AI provider implements this. Add Anthropic, Gemini, etc. by adding a file + registry entry. */
export interface AIProvider {
  name: string;
  completeJson(input: CompleteJsonInput): Promise<string>;
}
