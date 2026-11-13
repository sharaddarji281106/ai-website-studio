import type { ReactNode } from "react";
import type { Section } from "@/modules/site/schema";
import { Contact } from "./sections/contact";
import { About, Cta, Hero } from "./sections/hero-about-cta";
import { Blog, Faq, Features, Gallery, Menu, Pricing, Products, Testimonials } from "./sections/collections";
import { Footer, Navbar } from "./sections/nav-footer";

type C = (a: { section: Section; base: string }) => ReactNode;

const REGISTRY: Record<string, C> = {
  navbar: Navbar, hero: Hero, about: About, features: Features, menu: Menu, products: Products,
  pricing: Pricing, testimonials: Testimonials, gallery: Gallery, faq: Faq, blog: Blog,
  contact: Contact, cta: Cta, footer: Footer,
};

export function renderSection(section: Section, base: string): ReactNode {
  const C = REGISTRY[section.type];
  return C ? <C section={section} base={base} /> : null;
}
