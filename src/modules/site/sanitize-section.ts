import { cleanCodeProps } from "./code";
import { sanitizeDeep } from "./sanitize";
import { cleanSectionProps } from "./style";

/** The one place a section's props are cleaned before they are stored (save route, saved components).
 *  Code blocks keep their code (size-capped); every other block goes through the strict text sanitizer. */
export function sanitizeSectionProps(type: string, props: Record<string, unknown>, opts: { allowImage?: boolean } = {}): Record<string, unknown> {
  if (type === "code") {
    const { html, css, js, height, ...rest } = props;
    const meta = cleanSectionProps(sanitizeDeep(rest) as Record<string, unknown>, opts);
    return { ...meta, ...cleanCodeProps({ html, css, js, height }) };
  }
  return cleanSectionProps(sanitizeDeep(props) as Record<string, unknown>, opts);
}
