"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FiltersPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 lg:hidden">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-zinc-600">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          {open ? "Hide" : "Show"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="hidden lg:flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>

      <div className={`${open ? "mt-6" : "mt-6 hidden"} lg:mt-6 lg:block`}>
        {action ? <div className="mb-4 lg:hidden">{action}</div> : null}
        {children}
      </div>
    </section>
  );
}
