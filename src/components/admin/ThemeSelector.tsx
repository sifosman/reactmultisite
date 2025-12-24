"use client";

import { useState, useEffect } from "react";
import { Check, Eye, Loader2 } from "lucide-react";
import type { Theme } from "@/lib/config/site";
import { themes } from "@/lib/config/themes";

interface ThemePreview {
  id: Theme;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

const themePreviewData: ThemePreview[] = [
  {
    id: "default",
    name: themes.default.name,
    description: themes.default.description,
    preview: {
      primary: themes.default.colors.primary,
      secondary: themes.default.colors.secondary,
      accent: themes.default.colors.accent,
      background: themes.default.colors.background,
    },
  },
  {
    id: "luxury",
    name: themes.luxury.name,
    description: themes.luxury.description,
    preview: {
      primary: themes.luxury.colors.primary,
      secondary: themes.luxury.colors.secondary,
      accent: themes.luxury.colors.accent,
      background: themes.luxury.colors.background,
    },
  },
  {
    id: "minimal",
    name: themes.minimal.name,
    description: themes.minimal.description,
    preview: {
      primary: themes.minimal.colors.primary,
      secondary: themes.minimal.colors.secondary,
      accent: themes.minimal.colors.accent,
      background: themes.minimal.colors.background,
    },
  },
  {
    id: "vibrant",
    name: themes.vibrant.name,
    description: themes.vibrant.description,
    preview: {
      primary: themes.vibrant.colors.primary,
      secondary: themes.vibrant.colors.secondary,
      accent: themes.vibrant.colors.accent,
      background: themes.vibrant.colors.background,
    },
  },
];

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("default");
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentTheme();
  }, []);

  async function fetchCurrentTheme() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/theme");
      if (!response.ok) throw new Error("Failed to fetch theme");
      const data = await response.json();
      setCurrentTheme(data.theme);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function applyTheme(theme: Theme) {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to apply theme (${response.status})`);
      }

      setCurrentTheme(theme);
      setPreviewTheme(null);
      
      // Reload the page to apply the theme globally
      window.location.reload();
    } catch (err: any) {
      console.error("Theme application error:", err);
      setError(err.message || "Failed to apply theme. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {themePreviewData.map((theme) => {
          const isActive = currentTheme === theme.id;
          const isPreviewing = previewTheme === theme.id;

          return (
            <div
              key={theme.id}
              className={`relative rounded-xl border-2 bg-white p-6 transition-all ${
                isActive
                  ? "border-indigo-600 shadow-lg"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {isActive && (
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  <Check className="h-3 w-3" />
                  Active
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">{theme.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{theme.description}</p>
              </div>

              {/* Color Preview */}
              <div className="mb-6 rounded-lg border border-slate-200 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Color Palette
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <div
                      className="h-12 w-full rounded-md border border-slate-200"
                      style={{ backgroundColor: theme.preview.primary }}
                    />
                    <div className="text-xs text-slate-500">Primary</div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-12 w-full rounded-md border border-slate-200"
                      style={{ backgroundColor: theme.preview.secondary }}
                    />
                    <div className="text-xs text-slate-500">Secondary</div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-12 w-full rounded-md border border-slate-200"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                    <div className="text-xs text-slate-500">Accent</div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-12 w-full rounded-md border border-slate-200"
                      style={{ backgroundColor: theme.preview.background }}
                    />
                    <div className="text-xs text-slate-500">Background</div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mb-4 rounded-lg border border-slate-200 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Style Preview
                </div>
                <div className="space-y-3">
                  {/* Sample button */}
                  <button
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: theme.preview.primary,
                      color: themes[theme.id].colors.primaryForeground,
                    }}
                  >
                    Primary Button
                  </button>
                  {/* Sample card */}
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: theme.preview.secondary }}
                  >
                    <div
                      className="text-sm font-medium"
                      style={{ color: themes[theme.id].colors.secondaryForeground }}
                    >
                      Sample Card Content
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.open("/", "_blank")}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  <Eye className="mr-2 inline-block h-4 w-4" />
                  Preview Store
                </button>
                {!isActive && (
                  <button
                    onClick={() => applyTheme(theme.id)}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      "Apply Theme"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="font-semibold text-blue-900">How it works</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Preview each theme to see the color palette and styling</li>
          <li>• Click "Preview Store" to see how it looks on your live site</li>
          <li>• Click "Apply Theme" to activate a new theme</li>
          <li>• Your site content will remain unchanged when switching themes</li>
        </ul>
      </div>
    </div>
  );
}
