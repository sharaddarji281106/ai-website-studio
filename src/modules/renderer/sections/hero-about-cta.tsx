import type { Section } from "@/modules/site/schema";
import { Media } from "../media";
import { Head, Shell } from "../shell";
import { resolveHref, str } from "../utils";

type P = { section: Section; base: string };

export function Hero({ section, base }: P) {
  const p = section.props;
  const hasMedia = !!(str(p.image) || str(p.imageQuery));
  return (
    <Shell section={section} className="st-hero">
      <div className={`st-wrap st-hero-grid${hasMedia ? " has-media" : ""}`}>
        <div className="st-hero-copy">
          <h1>{str(p.heading)}</h1>
          {str(p.subheading) && <p className="st-lead">{str(p.subheading)}</p>}
          {str(p.ctaLabel) && (
            <div className="st-actions">
              <a className="st-btn" href={resolveHref(base, p.ctaHref)}>{str(p.ctaLabel)}</a>
            </div>
          )}
        </div>
        {hasMedia && <Media src={p.image} query={p.imageQuery} className="st-hero-media" />}
      </div>
    </Shell>
  );
}

export function About({ section }: P) {
  const p = section.props;
  const hasMedia = !!(str(p.image) || str(p.imageQuery));
  return (
    <Shell section={section} className="st-about">
      <div className={`st-wrap st-split${hasMedia ? " has-media" : ""}`}>
        {hasMedia && <Media src={p.image} query={p.imageQuery} className="st-split-media" />}
        <div>
          {str(p.heading) && <h2>{str(p.heading)}</h2>}
          {str(p.body) && <p className="st-body">{str(p.body)}</p>}
        </div>
      </div>
    </Shell>
  );
}

export function Cta({ section, base }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-cta">
      <div className="st-wrap st-cta-inner">
        {str(p.heading) && <h2>{str(p.heading)}</h2>}
        {str(p.body) && <p className="st-lead">{str(p.body)}</p>}
        {str(p.ctaLabel) && (
          <div className="st-actions">
            <a className="st-btn" href={resolveHref(base, p.ctaHref)}>{str(p.ctaLabel)}</a>
          </div>
        )}
      </div>
    </Shell>
  );
}
