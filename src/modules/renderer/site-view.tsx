import type { ReactNode } from "react";
import type { Section, Theme } from "@/modules/site/schema";
import { renderSection } from "./render-section";
import { themeStyle } from "./theme";

/** Themed container. Responsive CSS uses container queries on this element, so the same markup
 *  responds to the editor's device frames and to a real browser window. */
export function SiteRoot({ theme, live, children }: { theme: Theme; live?: boolean; children: ReactNode }) {
  return (
    <div className="site-root" data-mode={theme.mode} data-live={live ? "" : undefined} style={themeStyle(theme)}>
      {children}
    </div>
  );
}

export function SitePageView({ theme, sections, base, live }: { theme: Theme; sections: Section[]; base: string; live?: boolean }) {
  return (
    <SiteRoot theme={theme} live={live}>
      {sections.map((s) => (
        <div key={s.id}>{renderSection(s, base)}</div>
      ))}
    </SiteRoot>
  );
}
