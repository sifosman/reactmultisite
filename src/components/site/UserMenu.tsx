"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <button
        className="hidden h-10 w-10 items-center justify-center rounded-full border bg-white sm:inline-flex"
        aria-label="Account"
        disabled
      >
        <User className="h-4 w-4 text-zinc-400" />
      </button>
    );
  }

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-1.5 rounded-full border bg-white px-3 hover:bg-zinc-50"
        aria-label="Account menu"
      >
        <User className="h-4 w-4" />
        <ChevronDown className="h-3 w-3 text-zinc-600" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-[200px] rounded-lg border bg-white shadow-lg">
          {user ? (
            <>
              <div className="border-b px-4 py-3">
                <div className="text-xs text-zinc-600">Signed in as</div>
                <div className="mt-0.5 truncate text-sm font-medium">{user.email}</div>
              </div>
              <div className="p-1">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100"
                >
                  <User className="h-4 w-4" />
                  My account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="p-1">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100"
              >
                <User className="h-4 w-4" />
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100"
              >
                <User className="h-4 w-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
