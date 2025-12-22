"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountDetailsForm({
  initialFullName,
  initialPhone,
  email,
}: {
  initialFullName: string;
  initialPhone: string;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/account/details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName || null, phone: phone || null }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ?? "Save failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Full name</label>
        <input
          className="h-10 w-full rounded-md border bg-white px-3 text-sm"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input
          className="h-10 w-full rounded-md border bg-zinc-50 px-3 text-sm text-zinc-700"
          value={email}
          disabled
        />
        <p className="text-xs text-zinc-500">Email comes from your login and cannot be changed here.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone</label>
        <input
          className="h-10 w-full rounded-md border bg-white px-3 text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +27 82 123 4567"
        />
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
      ) : null}

      <button
        type="submit"
        className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save details"}
      </button>

      {saved ? (
        <div className="text-xs text-emerald-700">Details updated.</div>
      ) : null}
    </form>
  );
}
