"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/i18n/config";
import { localePath, cn } from "@/lib/utils";

type Nav = {
  how: string;
  features: string;
  pricing: string;
  faq: string;
  blog: string;
  login: string;
  cta: string;
};

export function Header({ locale, nav }: { locale: Locale; nav: Nav }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how", label: nav.how },
    { href: "#features", label: nav.features },
    { href: "#pricing", label: nav.pricing },
    { href: "#faq", label: nav.faq },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-line bg-white/80 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={localePath(locale)} aria-label="Paynote">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher locale={locale} />
          <Link
            href={localePath(locale, "/login")}
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink transition hover:text-brand-700"
          >
            {nav.login}
          </Link>
          <Link
            href={localePath(locale, "/register")}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            {nav.cta}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher locale={locale} />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              {open ? (
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-surface"
              >
                {l.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={localePath(locale, "/login")}
                className="rounded-xl border border-line px-4 py-3 text-center text-sm font-semibold text-ink"
              >
                {nav.login}
              </Link>
              <Link
                href={localePath(locale, "/register")}
                className="rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {nav.cta}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
