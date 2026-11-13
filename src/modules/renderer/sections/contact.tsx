import type { Section } from "@/modules/site/schema";
import { Head, Shell } from "../shell";
import { str, strs } from "../utils";

export function Contact({ section }: { section: Section; base: string }) {
  const p = section.props;
  const fields = strs(p.fields).length ? strs(p.fields) : ["Name", "Email", "Message"];
  return (
    <Shell section={section} className="st-contact">
      <div className="st-wrap st-split has-media">
        <div>
          <Head p={{ heading: p.heading }} />
          {str(p.body) && <p className="st-body">{str(p.body)}</p>}
          <ul className="st-list st-contact-info">
            {str(p.email) && <li>✉ {str(p.email)}</li>}
            {str(p.phone) && <li>☎ {str(p.phone)}</li>}
            {str(p.address) && <li>⌖ {str(p.address)}</li>}
          </ul>
        </div>
        <form className="st-card st-form" action="#">
          {fields.map((f, i) =>
            /message|comment|note|details/i.test(f) ? (
              <label key={i}>{f}<textarea rows={4} name={f} /></label>
            ) : (
              <label key={i}>{f}<input name={f} type={/email/i.test(f) ? "email" : "text"} /></label>
            ),
          )}
          <button type="button" className="st-btn">Send message</button>
        </form>
      </div>
    </Shell>
  );
}
