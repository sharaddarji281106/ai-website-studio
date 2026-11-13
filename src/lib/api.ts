import { NextResponse } from "next/server";
import { AIError } from "@/modules/ai/errors";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleKnownError(e: unknown) {
  if (e instanceof AIError) {
    if (e.code === "AI_NOT_CONFIGURED") return jsonError(e.message === e.code ? "AI is not configured on the server." : e.message, 503);
    if (e.code === "AI_UNAVAILABLE") return jsonError(e.message, 503);
    if (e.code === "AI_BAD_OUTPUT") return jsonError("The AI model returned an unusable result. Try again, or use a larger model.", 502);
    return jsonError("The AI provider failed. Please try again.", 502);
  }
  if (e instanceof Error) {
    if (e.message === "PLAN_LIMIT_PROJECTS") return jsonError("Project limit reached for your plan. Upgrade to create more.", 403);
    if (e.message === "PLAN_LIMIT_AI") return jsonError("Monthly AI limit reached for your plan.", 403);
  }
  console.error(e);
  return jsonError("Something went wrong", 500);
}
