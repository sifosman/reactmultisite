import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Admin access required</h1>
      <div className="mt-2 text-sm text-zinc-600">
        You are signed in, but your account is not marked as an admin.
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4 text-sm text-zinc-700">
        In Supabase, open the <span className="font-mono">profiles</span> table and set your
        row’s <span className="font-mono">role</span> to <span className="font-mono">admin</span>.
      </div>

      <div className="mt-6 flex gap-3">
        <Link className="rounded-md border px-4 py-2 text-sm" href="/account">
          Account
        </Link>
        <Link className="rounded-md bg-black px-4 py-2 text-sm text-white" href="/">
          Back to store
        </Link>
      </div>
    </main>
  );
}
