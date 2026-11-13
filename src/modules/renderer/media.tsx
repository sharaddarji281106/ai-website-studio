import { cx } from "./utils";

/** Real image if an https/relative URL is set, otherwise a tasteful placeholder showing the AI's image description. */
export function Media({ src, query, className }: { src?: unknown; query?: unknown; className?: string }) {
  const url = typeof src === "string" ? src.trim() : "";
  const label = typeof query === "string" ? query : "";
  if (/^(https:\/\/|\/)/.test(url)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={label} className={cx("st-media", className)} loading="lazy" />;
  }
  if (!label) return null;
  return (
    <div className={cx("st-media st-media-ph", className)} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m4 18 5-5 4 4 3-3 4 4" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
