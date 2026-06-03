"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencyToggle } from "./CurrencyToggle";
import { logoutAction } from "@/lib/actions/auth";
import type { Locale } from "@/i18n/config";
import type { Currency } from "@/lib/format";
import { localePath, cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  currency: Currency;
  userName: string;
  businessName: string;
  phone: string;
  smsBalance: number;
  dict: {
    search: string;
    wallet: string;
    myAccount: string;
    business: string;
    logout: string;
  };
};

export function Topbar({ locale, currency, userName, businessName, phone, smsBalance, dict }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(localePath(locale, `/dashboard/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`));
  }

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-line bg-white/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        {/* Search */}
        <form onSubmit={onSearch} className="relative min-w-0 flex-1 sm:max-w-md">
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.search}
            className="w-full rounded-full border border-line bg-surface/60 py-2 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          {/* Wallet */}
          <Link
            href={localePath(locale, "/dashboard/messages")}
            className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm shadow-soft transition hover:border-brand-300 sm:inline-flex"
            title={dict.wallet}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-emerald-600" aria-hidden>
              <path d="M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-bold tabular-nums text-ink">{smsBalance}</span>
            <span className="text-xs text-muted">SMS</span>
          </Link>

          <CurrencyToggle initial={currency} />
          <LanguageSwitcher locale={locale} />

          {/* Profile */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenu((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-soft ring-2 ring-white transition hover:brightness-105"
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              {initial}
            </button>
            {menu && (
              <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
                <div className="flex items-center gap-3 border-b border-line bg-surface/50 px-4 py-3.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{userName}</p>
                    <p className="truncate text-xs text-muted">{phone}</p>
                  </div>
                </div>
                <div className="px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted">{dict.business}</p>
                  <p className="mt-0.5 font-semibold text-ink">{businessName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted">{dict.wallet}</span>
                    <span className="font-semibold tabular-nums text-emerald-600">{smsBalance} SMS</span>
                  </div>
                </div>
                <form action={logoutAction} className="border-t border-line">
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                      <path d="M15 12H4m0 0 4-4m-4 4 4 4M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {dict.logout}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
