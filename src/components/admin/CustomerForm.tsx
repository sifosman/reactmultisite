"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerForm({
  mode,
  customerId,
  initial,
}: {
  mode: "create" | "edit";
  customerId?: string;
  initial?: {
    email?: string;
    full_name?: string;
    phone?: string;
    address?: string;
  };
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initial?.email ?? "");
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/customers" : `/api/admin/customers/${customerId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            full_name: fullName || undefined,
            phone: phone || undefined,
            address: address || undefined,
          }),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ?? "Failed to save customer");
        setLoading(false);
        return;
      }

      router.push("/admin/customers");
      router.refresh();
    } catch (err) {
      setError("Failed to save customer");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Customer Information</h2>
        
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Email *</label>
            <input
              type="email"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <input
              type="tel"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, province, postal code"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-md bg-black px-5 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : mode === "create" ? "Create Customer" : "Save Changes"}
      </button>
    </form>
  );
}
