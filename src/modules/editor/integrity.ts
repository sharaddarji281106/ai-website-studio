
import { SECTION_TYPES, FONTS } from "@/modules/site/schema";
import type { Doc, EditorPage } from "./types";

export type IntegrityIssue = {
  code:
    | "EMPTY_DOCUMENT"
    | "INVALID_PAGE_ID"
    | "DUPLICATE_PAGE_ID"
    | "INVALID_PAGE_SLUG"
    | "DUPLICATE_PAGE_SLUG"
    | "INVALID_HOMEPAGE_COUNT"
    | "INVALID_SECTIONS"
    | "INVALID_SECTION_ID"
    | "DUPLICATE_SECTION_ID"
    | "INVALID_SECTION_TYPE"
    | "INVALID_SECTION_PROPS"
    | "INVALID_THEME";
  path: string;
  message: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const colorPattern = /^#[0-9a-fA-F]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateDoc(doc: unknown): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  if (!isRecord(doc) || !Array.isArray(doc.pages) || doc.pages.length === 0) {
    return [{
      code: "EMPTY_DOCUMENT",
      path: "pages",
      message: "A document must contain at least one page.",
    }];
  }

  const pageIds = new Set<string>();
  const slugs = new Set<string>();
  const sectionIds = new Set<string>();
  let homepageCount = 0;

  if (
    !isRecord(doc.theme) ||
    typeof doc.theme.primaryColor !== "string" ||
    !colorPattern.test(doc.theme.primaryColor) ||
    (doc.theme.mode !== "light" && doc.theme.mode !== "dark") ||
    typeof doc.theme.fontFamily !== "string" ||
    !(FONTS as readonly string[]).includes(doc.theme.fontFamily) ||
    (doc.theme.headingFont !== undefined &&
      (typeof doc.theme.headingFont !== "string" || !(FONTS as readonly string[]).includes(doc.theme.headingFont)))
  ) {
    issues.push({
      code: "INVALID_THEME",
      path: "theme",
      message: "Theme values are invalid.",
    });
  }

  doc.pages.forEach((page: unknown, pageIndex: number) => {
    const pagePath = `pages[${pageIndex}]`;

    if (!isRecord(page)) {
      issues.push({
        code: "INVALID_PAGE_ID",
        path: `${pagePath}.id`,
        message: "Page must be a valid object.",
      });
      return;
    }

    if (typeof page.id !== "string" || !page.id.trim()) {
      issues.push({
        code: "INVALID_PAGE_ID",
        path: `${pagePath}.id`,
        message: "Page ID must be a non-empty string.",
      });
    } else if (pageIds.has(page.id)) {
      issues.push({
        code: "DUPLICATE_PAGE_ID",
        path: `${pagePath}.id`,
        message: `Duplicate page ID "${page.id}".`,
      });
    } else {
      pageIds.add(page.id);
    }

    if (
      typeof page.slug !== "string" ||
      !slugPattern.test(page.slug)
    ) {
      issues.push({
        code: "INVALID_PAGE_SLUG",
        path: `${pagePath}.slug`,
        message: "Page slug must be lowercase alphanumeric words separated by hyphens.",
      });
    } else if (slugs.has(page.slug)) {
      issues.push({
        code: "DUPLICATE_PAGE_SLUG",
        path: `${pagePath}.slug`,
        message: `Duplicate page slug "${page.slug}".`,
      });
    } else {
      slugs.add(page.slug);
    }

    if (page.isHome === true) homepageCount++;

    if (!Array.isArray(page.sections)) {
      issues.push({
        code: "INVALID_SECTIONS",
        path: `${pagePath}.sections`,
        message: "Page sections must be an array.",
      });
      return;
    }

    page.sections.forEach((section: unknown, sectionIndex: number) => {
      const sectionPath = `${pagePath}.sections[${sectionIndex}]`;

      if (!isRecord(section)) {
        issues.push({
          code: "INVALID_SECTION_PROPS",
          path: sectionPath,
          message: "Section must be a valid object.",
        });
        return;
      }

      if (typeof section.id !== "string" || !section.id.trim()) {
        issues.push({
          code: "INVALID_SECTION_ID",
          path: `${sectionPath}.id`,
          message: "Section ID must be a non-empty string.",
        });
      } else if (sectionIds.has(section.id)) {
        issues.push({
          code: "DUPLICATE_SECTION_ID",
          path: `${sectionPath}.id`,
          message: `Duplicate section ID "${section.id}".`,
        });
      } else {
        sectionIds.add(section.id);
      }

      if (
        typeof section.type !== "string" ||
        !(SECTION_TYPES as readonly string[]).includes(section.type)
      ) {
        issues.push({
          code: "INVALID_SECTION_TYPE",
          path: `${sectionPath}.type`,
          message: "Section type is not supported.",
        });
      }

      if (!isRecord(section.props)) {
        issues.push({
          code: "INVALID_SECTION_PROPS",
          path: `${sectionPath}.props`,
          message: "Section props must be an object.",
        });
      }
    });
  });

  if (homepageCount !== 1) {
    issues.push({
      code: "INVALID_HOMEPAGE_COUNT",
      path: "pages",
      message: `Document must contain exactly one homepage; found ${homepageCount}.`,
    });
  }

  return issues;
}

/** Returns the homepage ID, falling back to the first page if necessary. */
export function resolveActivePageId(doc: Doc, requestedId?: string): string {
  if (requestedId && doc.pages.some((page) => page.id === requestedId)) {
    return requestedId;
  }

  return doc.pages.find((page) => page.isHome)?.id ?? doc.pages[0]?.id ?? "";
}

/** Safe helper to check if a page belongs to the document. */
export function hasPage(doc: Doc, pageId: string): boolean {
  return doc.pages.some((page) => page.id === pageId);
}

/** Type guard for a page object. */
export function isEditorPage(value: unknown): value is EditorPage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.isHome === "boolean" &&
    Array.isArray(value.sections)
  );
}
