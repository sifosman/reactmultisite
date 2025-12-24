"use client";

import { useEffect, useState } from "react";

const PROVINCES = [
  "Western Cape",
  "Eastern Cape",
  "Northern Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Free State",
] as const;

export type DeliveryMode = "flat" | "per_province";

type ProvinceRate = {
  province: string;
  rateCents: number;
};

type SettingsResponse = {
  mode: DeliveryMode;
  flatRateCents: number;
  provinces: ProvinceRate[];
};

export function DeliverySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DeliveryMode>("flat");
  const [flatRate, setFlatRate] = useState<string>("60.00");
  const [provinceRates, setProvinceRates] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/delivery-settings", { method: "GET" });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error ?? "Failed to load delivery settings");
        }
        const json = (await res.json()) as SettingsResponse;
        setMode(json.mode);
        setFlatRate((json.flatRateCents / 100).toFixed(2));
        const next: Record<string, string> = {};
        for (const p of PROVINCES) {
          const existing = json.provinces.find((r) => r.province.toLowerCase() === p.toLowerCase());
          next[p] = existing ? (existing.rateCents / 100).toFixed(2) : (json.flatRateCents / 100).toFixed(2);
        }
        setProvinceRates(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load delivery settings");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const flatRateCents = Math.round(parseFloat(flatRate || "0") * 100);
      const provinces: ProvinceRate[] = PROVINCES.map((p) => {
        const value = provinceRates[p] ?? flatRate;
        const cents = Math.round(parseFloat(value || "0") * 100);
        return { province: p, rateCents: cents };
      });

      const res = await fetch("/api/admin/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, flatRateCents, provinces }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to save delivery settings");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save delivery settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">Loading delivery settings…</div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Mode</div>
        <p className="mt-1 text-xs text-slate-600">
          Choose whether to charge a single flat rate for all of South Africa, or different rates per province.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 text-sm hover:border-slate-400">
            <div>
              <div className="font-medium">Flat rate (all provinces)</div>
              <div className="text-xs text-slate-600">
                Every order uses the same delivery fee regardless of province.
              </div>
            </div>
            <input
              type="radio"
              className="h-4 w-4 border-slate-400 text-slate-900 focus:ring-slate-900"
              checked={mode === "flat"}
              onChange={() => setMode("flat")}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 text-sm hover:border-slate-400">
            <div>
              <div className="font-medium">Per province</div>
              <div className="text-xs text-slate-600">
                Use different delivery fees per province, with flat rate as the fallback.
              </div>
            </div>
            <input
              type="radio"
              className="h-4 w-4 border-slate-400 text-slate-900 focus:ring-slate-900"
              checked={mode === "per_province"}
              onChange={() => setMode("per_province")}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Flat rate</div>
        <p className="mt-1 text-xs text-slate-600">
          Default delivery fee in Rands. Used for all provinces in flat mode, and as a fallback in per-province mode.
        </p>

        <div className="mt-4 max-w-xs space-y-2">
          <label className="text-sm font-medium">Flat rate (R)</label>
          <input
            type="number"
            step="0.01"
            className="h-10 w-full rounded-md border px-3 text-sm"
            value={flatRate}
            onChange={(e) => setFlatRate(e.target.value)}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Per-province rates</div>
        <p className="mt-1 text-xs text-slate-600">
          Optional delivery fee per province in Rands. If left empty, the flat rate will be used for that province.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVINCES.map((p) => (
            <div key={p} className="space-y-1">
              <label className="text-xs font-medium text-slate-700">{p}</label>
              <input
                type="number"
                step="0.01"
                className="h-9 w-full rounded-md border px-3 text-sm"
                value={provinceRates[p] ?? ""}
                onChange={(e) =>
                  setProvinceRates((prev) => ({
                    ...prev,
                    [p]: e.target.value,
                  }))
                }
                placeholder={flatRate}
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save delivery settings"}
      </button>
    </form>
  );
}
