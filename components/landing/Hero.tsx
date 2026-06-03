import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";

type HeroDict = {
  badge: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stat1: string;
  stat1Label: string;
  stat2: string;
  stat2Label: string;
  stat3: string;
  stat3Label: string;
};

export function Hero({ locale, dict }: { locale: Locale; dict: HeroDict }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-ledger-dots" aria-hidden />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-gold-soft/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="animate-float-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper-2 px-3.5 py-1.5 text-[0.8rem] font-medium tracking-wide text-ledger-soft shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" />
            </span>
            {dict.badge}
          </span>

          <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.04] tracking-[-0.02em] text-ledger sm:text-6xl lg:text-[4rem]">
            {dict.title}{" "}
            <span className="ink-underline italic text-leaf">{dict.titleAccent}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ledger-soft">{dict.subtitle}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={localePath(locale, "/register")}
              className="group inline-flex items-center gap-2 rounded-full bg-leaf px-7 py-4 text-base font-semibold text-paper shadow-[0_16px_34px_-14px_rgba(28,107,74,0.95)] ring-1 ring-leaf-600/30 transition hover:bg-leaf-600"
            >
              {dict.ctaPrimary}
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 transition group-hover:translate-x-0.5">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-ledger/15 bg-paper-2 px-7 py-4 text-base font-semibold text-ledger transition hover:border-leaf/40 hover:bg-paper-3"
            >
              {dict.ctaSecondary}
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-rule border-y border-rule">
            {[
              [dict.stat1, dict.stat1Label],
              [dict.stat2, dict.stat2Label],
              [dict.stat3, dict.stat3Label],
            ].map(([value, label], i) => (
              <div key={label} className={i === 0 ? "py-4 pr-5" : "px-5 py-4"}>
                <dt className="font-display text-[1.7rem] font-semibold tabular-nums tracking-tight text-ledger">{value}</dt>
                <dd className="mt-1 text-[0.8rem] leading-snug text-ledger-soft">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-float-up [animation-delay:140ms]">
          <LedgerCard />
        </div>
      </div>
    </section>
  );
}

function LedgerCard() {
  const rows = [
    { name: "Akmal Karimov", amount: "1 250 000", state: "ok" },
    { name: "Dilnoza Yusupova", amount: "640 000", state: "warn" },
    { name: "Sherzod Toshmatov", amount: "3 100 000", state: "over" },
    { name: "Madina Saidova", amount: "420 000", state: "ok" },
  ];
  const dot: Record<string, string> = {
    ok: "bg-leaf",
    warn: "bg-gold",
    over: "bg-clay",
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* floating SMS note */}
      <div className="absolute -left-4 -top-5 z-20 hidden rotate-[-4deg] rounded-xl border border-rule bg-paper px-4 py-2.5 shadow-ledger sm:block">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-ledger-soft">SMS</p>
        <p className="mt-0.5 text-sm font-semibold text-leaf">Eslatma yetkazildi ✓</p>
      </div>

      {/* wax-stamp PAID */}
      <div className="animate-stamp absolute -right-3 top-16 z-20 hidden h-[4.4rem] w-[4.4rem] -rotate-[9deg] place-items-center rounded-full border-[3px] border-leaf/70 text-leaf sm:grid">
        <span className="grid h-full w-full place-items-center rounded-full border border-leaf/40">
          <span className="font-display text-[0.62rem] font-bold uppercase leading-tight tracking-[0.18em] text-center">
            Paid<br />Paynote
          </span>
        </span>
      </div>

      {/* stacked paper behind */}
      <div className="absolute inset-0 translate-x-3 translate-y-4 rotate-2 rounded-[1.4rem] border border-rule bg-paper-2" aria-hidden />

      <div className="relative overflow-hidden rounded-[1.4rem] border border-rule bg-paper-2 shadow-ledger">
        {/* ledger header */}
        <div className="flex items-center justify-between border-b border-rule bg-paper px-5 py-4">
          <div>
            <p className="font-display text-sm italic text-ledger-soft">Qarz daftari</p>
            <p className="mt-0.5 font-display text-[1.9rem] font-semibold tabular-nums leading-none text-ledger">
              ₸ 5 410 000
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-50 text-leaf ring-1 ring-leaf/15">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M3 17l5-5 4 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 8h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {/* ruled rows with red margin line */}
        <div className="relative bg-ledger-lines px-5 py-3">
          <span className="pointer-events-none absolute inset-y-0 left-9 w-px bg-clay/30" aria-hidden />
          {rows.map((r) => (
            <div key={r.name} className="relative flex h-12 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-3 font-display text-sm font-semibold text-ledger ring-1 ring-rule">
                {r.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ledger">{r.name}</span>
              <span className="font-display text-sm font-semibold tabular-nums text-ledger">₸ {r.amount}</span>
              <span className={`h-2 w-2 rounded-full ${dot[r.state]}`} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-rule bg-paper px-5 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-ledger-soft">4 mijoz · 1 muddati o&apos;tgan</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-2.5 py-1 text-xs font-semibold text-leaf">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Faol
          </span>
        </div>
      </div>
    </div>
  );
}
