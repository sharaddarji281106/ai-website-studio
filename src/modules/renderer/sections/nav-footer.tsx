import type { Section } from "@/modules/site/schema";
import { Shell } from "../shell";
import { arr, isExternal, resolveHref, str } from "../utils";

type P = { section: Section; base: string };

export function Navbar({ section, base }: P) {
  const p = section.props;
  const links = arr(p.links);
  const render = links.map((l, i) => (
    <a key={i} href={resolveHref(base, l.href)} {...(isExternal(l.href) ? { rel: "noopener noreferrer" } : {})}>
      {str(l.label)}
    </a>
  ));
  return (
    <Shell section={section} tag="header" className="st-nav">
      <div className="st-wrap st-nav-row">
        <a className="st-brand" href={resolveHref(base, "/")}>{str(p.brand)}</a>
        <nav className="st-nav-links">{render}</nav>
        <details className="st-menu">
          <summary aria-label="Menu">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <div className="st-menu-panel">{render}</div>
        </details>
      </div>
    </Shell>
  );
}

export function Footer({ section, base }: P) {
  const p = section.props;
  return (
    <Shell section={section} tag="footer" className="st-footer">
      <div className="st-wrap st-footer-row">
        <div>
          <a className="st-brand" href={resolveHref(base, "/")}>{str(p.brand)}</a>
          {str(p.copyright) && <p className="st-muted st-small">{str(p.copyright)}</p>}
        </div>
        <nav className="st-footer-links">
          {arr(p.links).map((l, i) => (
            <a key={i} href={resolveHref(base, l.href)}>{str(l.label)}</a>
          ))}
        </nav>
      </div>
    </Shell>
  );
}
