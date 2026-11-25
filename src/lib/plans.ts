import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

/** Single source of truth for plan limits. Enforced on the SERVER only. */
export const PLAN_LIMITS: Record<
  Plan,
  { aiGenerationsPerMonth: number; aiEditsPerMonth: number; maxProjects: number; maxSavedComponents: number; customDomain: boolean; codeExport: boolean }
> = {
  FREE: { aiGenerationsPerMonth: 3, aiEditsPerMonth: 20, maxProjects: 1, maxSavedComponents: 5, customDomain: false, codeExport: false },
  PRO: { aiGenerationsPerMonth: 50, aiEditsPerMonth: 500, maxProjects: 10, maxSavedComponents: 50, customDomain: true, codeExport: true },
  BUSINESS: { aiGenerationsPerMonth: 300, aiEditsPerMonth: 3000, maxProjects: 100, maxSavedComponents: 500, customDomain: true, codeExport: true },
};

export async function assertCanCreateProject(userId: string, plan: Plan) {
  const count = await db.project.count({ where: { userId } });
  if (count >= PLAN_LIMITS[plan].maxProjects) {
    throw new Error("PLAN_LIMIT_PROJECTS");
  }
}

export async function assertCanSaveComponent(userId: string, plan: Plan) {
  const count = await db.savedComponent.count({ where: { userId } });
  if (count >= PLAN_LIMITS[plan].maxSavedComponents) throw new Error("PLAN_LIMIT_COMPONENTS");
}

export async function assertAiQuota(userId: string, plan: Plan, kind: "ai_generation" | "ai_edit") {
  // Local Ollama costs nothing, so quotas can be switched off during development.
  if (process.env.DISABLE_AI_QUOTA === "true") return;
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const used = await db.usageRecord.count({ where: { userId, kind, createdAt: { gte: since } } });
  const limit = kind === "ai_generation" ? PLAN_LIMITS[plan].aiGenerationsPerMonth : PLAN_LIMITS[plan].aiEditsPerMonth;
  if (used >= limit) throw new Error("PLAN_LIMIT_AI");
}
