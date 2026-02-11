/**
 * Site Configuration
 * 
 * This file centralizes all client-specific configuration.
 * When setting up for a new client, update the .env.local file with their values.
 */

export type Theme = "default" | "luxury" | "minimal" | "vibrant";

export interface SiteConfig {
  // Branding
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  favicon?: string;
  
  // Contact
  email: string;
  phone?: string;
  address?: string;
  
  // Social
  social: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  
  // Theme
  theme: Theme;
  
  // Currency
  currency: {
    code: string;
    symbol: string;
    locale: string;
  };
  
  // Shipping
  shipping: {
    flatRateCents: number;
    freeShippingThresholdCents?: number;
  };
  
  // Features
  features: {
    guestCheckout: boolean;
    reviews: boolean;
    wishlist: boolean;
  };
  
  // Announcement bar
  announcement?: {
    enabled: boolean;
    text: string;
    badge?: string;
  };
}

// Default configuration - overridden by environment variables
const defaultConfig: SiteConfig = {
  name: "Coastal Warehouse",
  logo: "/logo.png",
  tagline: "Wholesale and retail, nationwide delivery",
  description: "Your one-stop shop for quality products",
  
  email: "thecoastalwarehouse@gmail.com",
  
  social: {},
  
  theme: "default",
  
  currency: {
    code: "ZAR",
    symbol: "R",
    locale: "en-ZA",
  },
  
  shipping: {
    flatRateCents: 6000,
    freeShippingThresholdCents: undefined,
  },
  
  features: {
    guestCheckout: true,
    reviews: false,
    wishlist: false,
  },
  
  announcement: {
    enabled: true,
    text: "Great products. Great deals. Delivered fast.",
    badge: undefined,
  },
};

/**
 * Get the site configuration from environment variables
 */
export function getSiteConfig(): SiteConfig {
  return {
    name: process.env.NEXT_PUBLIC_SITE_NAME || defaultConfig.name,
    tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || defaultConfig.tagline,
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || defaultConfig.description,
    logo: process.env.NEXT_PUBLIC_SITE_LOGO || defaultConfig.logo,
    favicon: process.env.NEXT_PUBLIC_SITE_FAVICON || defaultConfig.favicon,
    
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || defaultConfig.email,
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || undefined,
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || undefined,
    
    social: {
      twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || undefined,
      facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || undefined,
      instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || undefined,
      tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || undefined,
    },
    
    theme: (process.env.NEXT_PUBLIC_THEME as Theme) || defaultConfig.theme,
    
    currency: {
      code: process.env.NEXT_PUBLIC_CURRENCY_CODE || defaultConfig.currency.code,
      symbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || defaultConfig.currency.symbol,
      locale: process.env.NEXT_PUBLIC_CURRENCY_LOCALE || defaultConfig.currency.locale,
    },
    
    shipping: {
      flatRateCents: Number(process.env.NEXT_PUBLIC_SHIPPING_FLAT_RATE_CENTS) || defaultConfig.shipping.flatRateCents,
      freeShippingThresholdCents: process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS 
        ? Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS) 
        : undefined,
    },
    
    features: {
      guestCheckout: process.env.NEXT_PUBLIC_FEATURE_GUEST_CHECKOUT !== "false",
      reviews: process.env.NEXT_PUBLIC_FEATURE_REVIEWS === "true",
      wishlist: process.env.NEXT_PUBLIC_FEATURE_WISHLIST === "true",
    },
    
    announcement: {
      enabled: process.env.NEXT_PUBLIC_ANNOUNCEMENT_ENABLED !== "false",
      text: process.env.NEXT_PUBLIC_ANNOUNCEMENT_TEXT || defaultConfig.announcement?.text || "",
      badge: process.env.NEXT_PUBLIC_ANNOUNCEMENT_BADGE || defaultConfig.announcement?.badge,
    },
  };
}

/**
 * Format price with site currency
 */
export function formatPrice(cents: number, config?: SiteConfig): string {
  const siteConfig = config || getSiteConfig();
  const amount = cents / 100;
  return `${siteConfig.currency.symbol}${amount.toFixed(2)}`;
}
