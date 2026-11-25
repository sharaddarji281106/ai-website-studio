import {
  BadgeDollarSign, Columns3, ImageIcon, Info, LayoutGrid, LayoutTemplate, Mail, MessageCircleQuestion,
  MousePointerClick, Newspaper, PanelBottom, PanelTop, Quote, ShoppingBag, SeparatorHorizontal, SquareCode, Type, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { uid } from "@/lib/uid";
import { DEFAULT_CODE } from "@/modules/site/code";
import type { Section, SectionType } from "@/modules/site/schema";

/** Library groups, in the order they are shown. */
export const LIBRARY_CATEGORIES = ["Basic", "Navigation", "Hero & content", "Social proof", "Conversion", "Commerce", "Advanced"] as const;
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export const SECTION_META: Record<SectionType, { label: string; icon: LucideIcon }> = {
  navbar: { label: "Navigation", icon: PanelTop },
  hero: { label: "Hero", icon: LayoutTemplate },
  about: { label: "About", icon: Info },
  features: { label: "Features", icon: LayoutGrid },
  columns: { label: "Columns", icon: Columns3 },
  menu: { label: "Menu", icon: UtensilsCrossed },
  products: { label: "Products", icon: ShoppingBag },
  pricing: { label: "Pricing", icon: BadgeDollarSign },
  testimonials: { label: "Testimonials", icon: Quote },
  gallery: { label: "Gallery", icon: ImageIcon },
  faq: { label: "FAQ", icon: MessageCircleQuestion },
  blog: { label: "Blog", icon: Newspaper },
  contact: { label: "Contact", icon: Mail },
  cta: { label: "Call to action", icon: MousePointerClick },
  footer: { label: "Footer", icon: PanelBottom },
  text: { label: "Text", icon: Type },
  button: { label: "Button", icon: MousePointerClick },
  image: { label: "Image", icon: ImageIcon },
  spacer: { label: "Spacer / divider", icon: SeparatorHorizontal },
  code: { label: "Custom code", icon: SquareCode },
};

export const SECTION_CATEGORY: Record<SectionType, LibraryCategory> = {
  text: "Basic", button: "Basic", image: "Basic", spacer: "Basic",
  navbar: "Navigation", footer: "Navigation",
  hero: "Hero & content", about: "Hero & content", features: "Hero & content", columns: "Hero & content", faq: "Hero & content", gallery: "Hero & content", blog: "Hero & content",
  testimonials: "Social proof",
  pricing: "Conversion", cta: "Conversion", contact: "Conversion",
  menu: "Commerce", products: "Commerce",
  code: "Advanced",
};

export const SECTION_DEFAULTS: Record<SectionType, Record<string, unknown>> = {
  navbar: { brand: "Your Brand", links: [{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Contact", href: "/contact" }] },
  hero: { heading: "A headline that sells your idea", subheading: "One or two sentences that explain what you do and who it is for.", ctaLabel: "Get started", ctaHref: "#", imageQuery: "modern workspace", image: "" },
  about: { heading: "Our story", body: "Tell visitors who you are, what you believe in, and why you do this work.", imageQuery: "team working together", image: "" },
  features: { heading: "Why choose us", subheading: "Three reasons customers stay with us.", items: [{ title: "Fast", description: "Quick turnaround without cutting corners.", icon: "⚡" }, { title: "Reliable", description: "Consistent quality you can count on.", icon: "🛡️" }, { title: "Friendly", description: "Real people who care about your result.", icon: "💬" }] },
  columns: { heading: "Three columns", subheading: "", plain: false, items: [{ title: "First column", body: "Add text, a link or an image here.", ctaLabel: "", ctaHref: "#", imageQuery: "", image: "" }, { title: "Second column", body: "Change the number of columns in the Style tab.", ctaLabel: "", ctaHref: "#", imageQuery: "", image: "" }, { title: "Third column", body: "Columns stack on small screens.", ctaLabel: "", ctaHref: "#", imageQuery: "", image: "" }] },
  menu: { heading: "Our menu", categories: [{ name: "Starters", items: [{ name: "House salad", description: "Seasonal greens, citrus dressing", price: "$9" }] }, { name: "Mains", items: [{ name: "Grilled salmon", description: "Lemon butter, roasted vegetables", price: "$22" }] }] },
  products: { heading: "Featured products", items: [{ name: "Product one", description: "A short description.", price: "$29", imageQuery: "product photo", image: "" }, { name: "Product two", description: "A short description.", price: "$39", imageQuery: "product photo", image: "" }, { name: "Product three", description: "A short description.", price: "$49", imageQuery: "product photo", image: "" }] },
  pricing: { heading: "Simple pricing", subheading: "Pick a plan that fits.", plans: [{ name: "Starter", price: "$0", features: ["1 project", "Basic support"], ctaLabel: "Start free" }, { name: "Pro", price: "$19/mo", features: ["10 projects", "Priority support", "Custom domain"], ctaLabel: "Go Pro" }, { name: "Business", price: "$49/mo", features: ["Unlimited projects", "Team access"], ctaLabel: "Contact us" }] },
  testimonials: { heading: "Loved by customers", items: [{ quote: "Exactly what we needed, delivered on time.", author: "Alex Morgan", role: "Founder" }, { quote: "Professional, friendly and fast.", author: "Sam Lee", role: "Marketing lead" }, { quote: "I would recommend them to anyone.", author: "Priya Nair", role: "Designer" }] },
  gallery: { heading: "Gallery", images: [{ imageQuery: "photo one", caption: "Caption one", image: "" }, { imageQuery: "photo two", caption: "Caption two", image: "" }, { imageQuery: "photo three", caption: "Caption three", image: "" }] },
  faq: { heading: "Frequently asked questions", items: [{ question: "How does it work?", answer: "Explain the process in a sentence or two." }, { question: "How much does it cost?", answer: "Point to your pricing or explain your approach." }] },
  blog: { heading: "Latest articles", posts: [{ title: "First post title", excerpt: "A short teaser for the article.", date: "Jan 5, 2026" }, { title: "Second post title", excerpt: "A short teaser for the article.", date: "Jan 12, 2026" }, { title: "Third post title", excerpt: "A short teaser for the article.", date: "Jan 19, 2026" }] },
  contact: { heading: "Get in touch", body: "We usually reply within one business day.", fields: ["Name", "Email", "Message"], email: "hello@example.com", phone: "+1 555 0100", address: "123 Main Street" },
  cta: { heading: "Ready to get started?", body: "Join today and see the difference.", ctaLabel: "Get started", ctaHref: "#" },
  footer: { brand: "Your Brand", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }], copyright: "© 2026 Your Brand. All rights reserved." },
  text: { heading: "A heading", body: "Write your text here. Leave a blank line to start a new paragraph." },
  button: { ctaLabel: "Click me", ctaHref: "#" },
  image: { imageQuery: "Describe the image", image: "", caption: "" },
  spacer: { height: 48, line: false },
  code: { ...DEFAULT_CODE },
};

/** The name shown in Layers and on the canvas: the user's own label, or the block type. */
export function sectionLabel(s: Section): string {
  const l = typeof s.props.__label === "string" ? s.props.__label.trim() : "";
  return l || SECTION_META[s.type].label;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function newSection(type: SectionType): Section {
  return { id: uid(), type, props: clone(SECTION_DEFAULTS[type]) };
}

/** Fills keys the AI omitted (like "image") so the editor can show them. Existing values always win. */
export function withDefaults(type: SectionType, props: Record<string, unknown>): Record<string, unknown> {
  return { ...clone(SECTION_DEFAULTS[type]), ...props };
}
