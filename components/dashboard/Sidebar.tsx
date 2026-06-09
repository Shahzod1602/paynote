"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/i18n/config";
import { localePath, cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";

type NavDict = {
  overview: string;
  customers: string;
  debts: string;
  products: string;
  templates: string;
  messages: string;
  reports: string;
  settings: string;
  logout: string;
};

const icons: Record<string, React.ReactNode> = {
  overview: <path d="M4 13h7V4H4zM13 20h7v-9h-7zM13 4v4h7V4zM4 20h7v-4H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  customers: (
    <g>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 19c1-3 3.5-4.5 6-4.5S14 16 15 19M16 6.5a2.8 2.8 0 0 1 0 5.4M21 19c-.5-2-1.6-3.2-3.2-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  debts: <path d="M4 7h16v12H4zM4 11h16M8 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />,
  messages: <path d="M4 5h16v11H9l-4 3v-3H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />,
  products: <path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4m0 0 8-4m-8 4v8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />,
  templates: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />,
  reports: <path d="M5 19V5m0 14h14M9 16V9m4 7v-4m4 4V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  settings: (
    <g>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.5-6.5-1.4 1.4M8.9 15.1l-1.4 1.4m11 0-1.4-1.4M8.9 8.9 7.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
};

export function Sidebar({ locale, nav }: { locale: Locale; nav: NavDict }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    { key: "overview", href: "/dashboard", label: nav.overview },
    { key: "customers", href: "/dashboard/customers", label: nav.customers },
    { key: "debts", href: "/dashboard/debts", label: nav.debts },
    { key: "products", href: "/dashboard/products", label: nav.products },
    { key: "templates", href: "/dashboard/templates", label: nav.templates },
    { key: "messages", href: "/dashboard/messages", label: nav.messages },
    { key: "reports", href: "/dashboard/reports", label: nav.reports },
    { key: "settings", href: "/dashboard/settings", label: nav.settings },
  ];

  function isActive(href: string) {
    const full = localePath(locale, href);
    if (href === "/dashboard") return pathname === full;
    return pathname.startsWith(full);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink shadow-soft lg:hidden"
        aria-label="Menu"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6">
          <Link href={localePath(locale)}>
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.label + item.key}
              href={localePath(locale, item.href)}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-surface hover:text-ink"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">{icons[item.key]}</svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M15 12H4m0 0 4-4m-4 4 4 4M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {nav.logout}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
