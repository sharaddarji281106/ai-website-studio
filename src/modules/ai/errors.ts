export type AIErrorCode = "AI_NOT_CONFIGURED" | "AI_UNAVAILABLE" | "AI_PROVIDER_ERROR" | "AI_BAD_OUTPUT";

export class AIError extends Error {
  constructor(public code: AIErrorCode, message?: string) {
    super(message ?? code);
  }
}
