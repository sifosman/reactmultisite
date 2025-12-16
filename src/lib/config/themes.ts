/**
 * Theme Definitions
 * 
 * Each theme defines colors, fonts, and styling for different store types.
 */

import type { Theme } from "./site";

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryForeground: string;
  
  // Secondary colors
  secondary: string;
  secondaryForeground: string;
  
  // Accent colors
  accent: string;
  accentForeground: string;
  
  // Background colors
  background: string;
  foreground: string;
  
  // Card/surface colors
  card: string;
  cardForeground: string;
  
  // Muted colors
  muted: string;
  mutedForeground: string;
  
  // Border colors
  border: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
}

export interface ThemeConfig {
  name: string;
  description: string;
  colors: ThemeColors;
  borderRadius: string;
  fontFamily: string;
  fontFamilyHeading?: string;
}

export const themes: Record<Theme, ThemeConfig> = {
  default: {
    name: "Default",
    description: "Clean and modern, suitable for any store type",
    colors: {
      primary: "#18181b",
      primaryForeground: "#ffffff",
      secondary: "#f4f4f5",
      secondaryForeground: "#18181b",
      accent: "#18181b",
      accentForeground: "#ffffff",
      background: "#fafafa",
      foreground: "#18181b",
      card: "#ffffff",
      cardForeground: "#18181b",
      muted: "#f4f4f5",
      mutedForeground: "#71717a",
      border: "#e4e4e7",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    borderRadius: "0.75rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  
  luxury: {
    name: "Luxury",
    description: "Elegant and sophisticated for premium brands",
    colors: {
      primary: "#1a1a1a",
      primaryForeground: "#fafafa",
      secondary: "#292524",
      secondaryForeground: "#fafaf9",
      accent: "#b8860b",
      accentForeground: "#1a1a1a",
      background: "#0a0a0a",
      foreground: "#fafafa",
      card: "#171717",
      cardForeground: "#fafafa",
      muted: "#262626",
      mutedForeground: "#a3a3a3",
      border: "#333333",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    borderRadius: "0.25rem",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontFamilyHeading: "Georgia, 'Times New Roman', serif",
  },
  
  minimal: {
    name: "Minimal",
    description: "Ultra-clean design focused on products",
    colors: {
      primary: "#000000",
      primaryForeground: "#ffffff",
      secondary: "#f5f5f5",
      secondaryForeground: "#171717",
      accent: "#000000",
      accentForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#171717",
      card: "#ffffff",
      cardForeground: "#171717",
      muted: "#f5f5f5",
      mutedForeground: "#737373",
      border: "#e5e5e5",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    borderRadius: "0rem",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  
  vibrant: {
    name: "Vibrant",
    description: "Bold and colorful for fashion and lifestyle brands",
    colors: {
      primary: "#7c3aed",
      primaryForeground: "#ffffff",
      secondary: "#fce7f3",
      secondaryForeground: "#831843",
      accent: "#ec4899",
      accentForeground: "#ffffff",
      background: "#fdf4ff",
      foreground: "#1e1b4b",
      card: "#ffffff",
      cardForeground: "#1e1b4b",
      muted: "#f3e8ff",
      mutedForeground: "#6b21a8",
      border: "#e9d5ff",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    borderRadius: "1rem",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  
  natural: {
    name: "Natural",
    description: "Earthy and organic for wellness and eco-friendly stores",
    colors: {
      primary: "#365314",
      primaryForeground: "#f7fee7",
      secondary: "#ecfccb",
      secondaryForeground: "#365314",
      accent: "#84cc16",
      accentForeground: "#1a2e05",
      background: "#fefce8",
      foreground: "#1c1917",
      card: "#fffbeb",
      cardForeground: "#1c1917",
      muted: "#f5f5dc",
      mutedForeground: "#57534e",
      border: "#d6d3d1",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },
    borderRadius: "0.5rem",
    fontFamily: "'Lora', Georgia, serif",
  },
};

/**
 * Generate CSS variables for a theme
 */
export function getThemeCSSVariables(theme: Theme): string {
  const config = themes[theme];
  
  return `
    --color-primary: ${config.colors.primary};
    --color-primary-foreground: ${config.colors.primaryForeground};
    --color-secondary: ${config.colors.secondary};
    --color-secondary-foreground: ${config.colors.secondaryForeground};
    --color-accent: ${config.colors.accent};
    --color-accent-foreground: ${config.colors.accentForeground};
    --color-background: ${config.colors.background};
    --color-foreground: ${config.colors.foreground};
    --color-card: ${config.colors.card};
    --color-card-foreground: ${config.colors.cardForeground};
    --color-muted: ${config.colors.muted};
    --color-muted-foreground: ${config.colors.mutedForeground};
    --color-border: ${config.colors.border};
    --color-success: ${config.colors.success};
    --color-warning: ${config.colors.warning};
    --color-error: ${config.colors.error};
    --radius: ${config.borderRadius};
    --font-family: ${config.fontFamily};
    --font-family-heading: ${config.fontFamilyHeading || config.fontFamily};
  `.trim();
}
