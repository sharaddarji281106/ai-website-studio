/** Curated Google Fonts. Metadata (weights, fallback stack) lives in ./fonts.ts. Keep the first five: older sites use them. */
export const FONTS = [
  "Inter", "Poppins", "Playfair Display", "Roboto", "Lora",
  "Montserrat", "Open Sans", "Lato", "Nunito", "Raleway", "DM Sans", "Manrope", "Work Sans", "Space Grotesk",
  "Merriweather", "Source Serif 4", "Cormorant Garamond", "DM Serif Display",
  "Oswald", "Bebas Neue", "JetBrains Mono",
] as const;
export type FontName = (typeof FONTS)[number];
