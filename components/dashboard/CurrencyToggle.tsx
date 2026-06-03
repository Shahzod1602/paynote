"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CurrencyToggle({ initial }: { initial: Currency }) {
  const router = useRouter();
  const [cur, setCur] = useState<Currency>(initial);

  function set(c: Currency) {
    if (c === cur) return;
    setCur(c);
    document.cookie = `CURRENCY=${c}; path=/; max-age=31536000`;
    router.refresh();
  }

  const opts: { c: Currency; label: string }[] = [
    { c: "UZS", label: "so'm" },
    { c: "USD", label: "USD" },
  ];

  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-semibold shadow-soft" role="group" aria-label="Currency">
      <svg viewBox="0 0 24 24" fill="none" className="ml-1.5 mr-0.5 h-4 w-4 text-muted" aria-hidden>
        <path d="M3 7h18M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l2-3h14l2 3M16 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {opts.map((o) => (
        <button
          key={o.c}
          onClick={() => set(o.c)}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            cur === o.c ? "bg-brand-600 text-white shadow-soft" : "text-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
