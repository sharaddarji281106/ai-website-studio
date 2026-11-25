import type { ReactNode } from "react";
import type { Section } from "@/modules/site/schema";
import { Button, Code, ImageBlock, Spacer, Text } from "./sections/basic";
import { Contact } from "./sections/contact";
import { About, Cta, Hero } from "./sections/hero-about-cta";
import { Blog, Columns, Faq, Features, Gallery, Menu, Pricing, Products, Testimonials } from "./sections/collections";
import { Footer, Navbar } from "./sections/nav-footer";

type C = (a: { section: Section; base: string }) => ReactNode;

const REGISTRY: Record<string, C> = {
  navbar: Navbar, hero: Hero, about: About, features: Features, columns: Columns, menu: Menu, products: Products,
  pricing: Pricing, testimonials: Testimonials, gallery: Gallery, faq: Faq, blog: Blog,
  contact: Contact, cta: Cta, footer: Footer,
  text: Text, button: Button, image: ImageBlock, spacer: Spacer, code: Code,
};

export function renderSection(section: Section, base: string): ReactNode {
  const C = REGISTRY[section.type];
  return C ? <C section={section} base={base} /> : null;
}
