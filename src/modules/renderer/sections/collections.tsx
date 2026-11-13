import type { Section } from "@/modules/site/schema";
import { Media } from "../media";
import { Head, Shell } from "../shell";
import { arr, str, strs } from "../utils";

type P = { section: Section; base: string };

const isEmoji = (s: string) => s.length > 0 && /[^\u0000-\u007f]/.test(s);

export function Features({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-features">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c3">
          {arr(p.items).map((it, i) => (
            <article key={i} className="st-card">
              <div className="st-icon" aria-hidden>
                {isEmoji(str(it.icon)) ? str(it.icon) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></svg>
                )}
              </div>
              <h3>{str(it.title)}</h3>
              <p className="st-muted">{str(it.description)}</p>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Menu({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-menu-sec">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c2">
          {arr(p.categories).map((c, i) => (
            <div key={i} className="st-card">
              <h3>{str(c.name)}</h3>
              <ul className="st-list">
                {arr(c.items).map((m, j) => (
                  <li key={j}>
                    <div className="st-row">
                      <strong>{str(m.name)}</strong>
                      <span className="st-dots" />
                      <span className="st-price">{str(m.price)}</span>
                    </div>
                    {str(m.description) && <p className="st-muted st-small">{str(m.description)}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Products({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-products">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c3">
          {arr(p.items).map((it, i) => (
            <article key={i} className="st-card st-product">
              <Media src={it.image} query={it.imageQuery || it.name} className="st-product-media" />
              <h3>{str(it.name)}</h3>
              <p className="st-muted st-small">{str(it.description)}</p>
              <p className="st-price">{str(it.price)}</p>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Pricing({ section }: P) {
  const p = section.props;
  const plans = arr(p.plans);
  return (
    <Shell section={section} className="st-pricing">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c3">
          {plans.map((pl, i) => (
            <article key={i} className={`st-card st-plan${plans.length === 3 && i === 1 ? " featured" : ""}`}>
              <h3>{str(pl.name)}</h3>
              <p className="st-plan-price">{str(pl.price)}</p>
              <ul className="st-checks">
                {strs(pl.features).map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
              {str(pl.ctaLabel) && <a className="st-btn" href="#">{str(pl.ctaLabel)}</a>}
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Testimonials({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-testimonials">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c3">
          {arr(p.items).map((t, i) => (
            <figure key={i} className="st-card st-quote">
              <blockquote>&ldquo;{str(t.quote)}&rdquo;</blockquote>
              <figcaption>
                <strong>{str(t.author)}</strong>
                {str(t.role) && <span className="st-muted st-small"> · {str(t.role)}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Gallery({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-gallery">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c3">
          {arr(p.images).map((g, i) => (
            <figure key={i} className="st-tile">
              <Media src={g.image} query={g.imageQuery || g.caption} className="st-tile-media" />
              {str(g.caption) && <figcaption className="st-muted st-small">{str(g.caption)}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Faq({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-faq">
      <div className="st-wrap st-narrow">
        <Head p={p} />
        {arr(p.items).map((q, i) => (
          <details key={i} className="st-acc">
            <summary>{str(q.question)}</summary>
            <p className="st-muted">{str(q.answer)}</p>
          </details>
        ))}
      </div>
    </Shell>
  );
}

export function Blog({ section }: P) {
  const p = section.props;
  return (
    <Shell section={section} className="st-blog">
      <div className="st-wrap">
        <Head p={p} />
        <div className="st-grid c3">
          {arr(p.posts).map((b, i) => (
            <article key={i} className="st-card">
              {str(b.date) && <p className="st-muted st-small">{str(b.date)}</p>}
              <h3>{str(b.title)}</h3>
              <p className="st-muted">{str(b.excerpt)}</p>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
