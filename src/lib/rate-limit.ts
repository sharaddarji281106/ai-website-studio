// Simple in-memory limiter (single server). Swap for Redis when we deploy multiple instances.
// Note: counters reset when the server restarts or sleeps (e.g. Render free tier).
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  // Keep memory bounded: occasionally drop keys with no recent hits.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Best-effort client IP behind a proxy (Render sets x-forwarded-for). */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return "unknown";
  const get = (name: string): string => {
    if (headers instanceof Headers) return headers.get(name) ?? "";
    const v = headers[name];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };
  return get("x-forwarded-for").split(",")[0].trim() || get("x-real-ip").trim() || "unknown";
}
