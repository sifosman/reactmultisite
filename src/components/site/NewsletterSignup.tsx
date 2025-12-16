"use client";

import { useState } from "react";

export function NewsletterSignup({
  variant = "dark",
  source = "newsletter",
}: {
  variant?: "dark" | "light";
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isDark = variant === "dark";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });

    if (!res.ok) {
      setStatus("error");
      setMessage("Could not subscribe. Please try again.");
      return;
    }

    setEmail("");
    setStatus("success");
    setMessage("Subscribed! Check your inbox for future offers.");
    setTimeout(() => setStatus("idle"), 2000);
    setTimeout(() => setMessage(null), 2500);
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={
            isDark
              ? "flex-1 rounded-full border-0 bg-white/10 px-5 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              : "flex-1 rounded-full border border-zinc-200 bg-white px-5 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          }
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={
            isDark
              ? "w-full shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-70 sm:w-auto"
              : "w-full shrink-0 rounded-full bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-70 sm:w-auto"
          }
        >
          {status === "loading" ? "..." : status === "success" ? "Done" : "Subscribe"}
        </button>
      </form>

      {message ? (
        <div className={isDark ? "mt-3 text-sm text-zinc-300" : "mt-3 text-sm text-zinc-600"}>
          {message}
        </div>
      ) : null}

      {status === "success" ? (
        <div className="fixed bottom-6 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg sm:right-6">
          Subscribed
        </div>
      ) : null}
      {status === "error" ? (
        <div className="fixed bottom-6 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-lg sm:right-6">
          Subscribe failed
        </div>
      ) : null}
    </div>
  );
}
