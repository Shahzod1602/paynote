"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(next: Locale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || "/");
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-brand-300 hover:text-brand-700"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {locale.toUpperCase()}
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-pop"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                onClick={() => switchTo(l)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-surface",
                  l === locale ? "font-semibold text-brand-700" : "text-ink"
                )}
              >
                {localeNames[l]}
                {l === locale && (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
