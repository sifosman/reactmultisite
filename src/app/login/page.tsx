"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Decide redirect based on profile role
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.refresh();
        router.push("/account");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      router.refresh();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } catch {
      // Fallback: treat as normal customer
      router.refresh();
      router.push("/account");
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white">
      <div className="mx-auto flex max-w-md flex-col justify-start p-6 pt-10 text-zinc-900">
        <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            className="h-10 w-full rounded-md border px-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            className="h-10 w-full rounded-md border px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          className="h-10 w-full rounded-md bg-black px-4 text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

        <p className="mt-6 text-sm text-zinc-600">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline">
            Create one now
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
