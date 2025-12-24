"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, message }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus("error");
      setError(json?.error === "invalid_email" ? "Please enter a valid email address." : "Could not send your message. Please try again.");
      return;
    }

    setStatus("success");
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");

    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Name</label>
          <input
            className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Email</label>
          <input
            type="email"
            className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Phone (optional)</label>
          <input
            className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-900">Message</label>
          <textarea
            className="min-h-32 w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
      >
        {status === "loading" ? "Sending..." : status === "success" ? "Sent" : "Send message"}
      </button>
    </form>
  );
}
