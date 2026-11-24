import type { ReactNode } from "react";
import type { Section, Theme } from "@/modules/site/schema";
import { fontsHref } from "@/modules/site/fonts";
import { usedFonts } from "@/modules/site/style";
import { renderSection } from "./render-section";
import { themeStyle } from "./theme";

/** Themed container. Responsive CSS uses container queries on this element, so the same markup
 *  responds to the editor's device frames and to a real browser window. */
export function SiteRoot({ theme, sections, live, loadFonts = true, children }: { theme: Theme; sections?: Section[]; live?: boolean; loadFonts?: boolean; children: ReactNode }) {
  // Request only the Google Fonts this page uses (theme fonts + any per-section fonts).
  const fonts = loadFonts ? fontsHref(usedFonts(theme, sections ?? [])) : "";
  return (
    <div className="site-root" data-mode={theme.mode} data-live={live ? "" : undefined} style={themeStyle(theme)}>
      {fonts && <link rel="stylesheet" href={fonts} />}
      {children}
    </div>
  );
}

export function SitePageView({ theme, sections, base, live, loadFonts }: { theme: Theme; sections: Section[]; base: string; live?: boolean; loadFonts?: boolean }) {
  return (
    <SiteRoot theme={theme} sections={sections} live={live} loadFonts={loadFonts}>
      {sections.map((s) => (
        <div key={s.id}>{renderSection(s, base)}</div>
      ))}
    </SiteRoot>
  );
}
