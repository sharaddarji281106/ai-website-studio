/** Works on plain-http LAN origins too, where crypto.randomUUID is unavailable. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
