/** Strip markup and dangerous URL schemes from AI/user text; cap sizes. Pure (no server imports). */
export function sanitizeDeep(v: unknown, depth = 0): unknown {
  if (depth > 8) return null;
  if (typeof v === "string") {
    const s = v.replace(/[<>]/g, "").slice(0, 2000);
    return /^\s*(javascript|data|vbscript):/i.test(s) ? "" : s;
  }
  if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => sanitizeDeep(x, depth + 1));
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 60)
        .map(([k, val]) => [k.slice(0, 60), sanitizeDeep(val, depth + 1)]),
    );
  }
  return null;
}
