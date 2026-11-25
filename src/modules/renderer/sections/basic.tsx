import type { Section } from "@/modules/site/schema";
import { CODE_SANDBOX, buildCodeSrcDoc, cleanHeight } from "@/modules/site/code";
import { Media } from "../media";
import { Shell } from "../shell";
import { resolveHref, str } from "../utils";

type P = { section: Section; base: string };

/** Heading plus paragraphs (a blank line starts a new paragraph). */
export function Text({ section }: P) {
  const p = section.props;
  const paras = str(p.body).split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  return (
    <Shell section={section} className="st-basic st-text">
      <div className="st-wrap st-narrow-col">
        {str(p.heading) && <h2>{str(p.heading)}</h2>}
        {paras.map((t, i) => <p key={i} className="st-body">{t}</p>)}
      </div>
    </Shell>
  );
}

export function Button({ section, base }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-basic st-button-block">
      <div className="st-wrap">
        <div className="st-actions" style={{ marginTop: 0 }}>
          <a className="st-btn" href={resolveHref(base, p.ctaHref)}>{str(p.ctaLabel) || "Button"}</a>
        </div>
      </div>
    </Shell>
  );
}

export function ImageBlock({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-basic st-image-block">
      <figure className="st-wrap">
        <Media src={p.image} query={p.imageQuery} className="st-image-media" />
        {str(p.caption) && <figcaption className="st-muted st-small">{str(p.caption)}</figcaption>}
      </figure>
    </Shell>
  );
}

export function Spacer({ section }: P) {
  const p = section.props;
  const h = Math.min(400, Math.max(0, typeof p.height === "number" ? p.height : 48));
  return (
    <Shell section={section} className="st-basic st-spacer">
      <div className="st-wrap" style={{ height: h, display: "flex", alignItems: "center" }} aria-hidden>
        {p.line === true && <hr className="st-line" />}
      </div>
    </Shell>
  );
}

/** Custom HTML/CSS/JS. Runs ONLY inside a sandboxed iframe with no same-origin access (see site/code.ts). */
export function Code({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-basic st-code">
      <iframe
        title={str(p.__label) || "Custom code"}
        sandbox={CODE_SANDBOX}
        srcDoc={buildCodeSrcDoc(p)}
        style={{ width: "100%", height: cleanHeight(p.height), border: 0, display: "block", background: "transparent" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </Shell>
  );
}
