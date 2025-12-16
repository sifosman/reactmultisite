"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/lib/config/site";
import { themes, getThemeCSSVariables } from "@/lib/config/themes";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "default" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const cssVars = getThemeCSSVariables(theme);
    
    // Apply CSS variables
    cssVars.split(";").forEach((rule) => {
      const [property, value] = rule.split(":").map((s) => s.trim());
      if (property && value) {
        root.style.setProperty(property, value);
      }
    });

    // Apply theme class
    root.setAttribute("data-theme", theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Server-side theme styles to prevent flash
 */
export function ThemeStyles({ theme }: { theme: Theme }) {
  const cssVars = getThemeCSSVariables(theme);
  
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${cssVars} }`,
      }}
    />
  );
}
