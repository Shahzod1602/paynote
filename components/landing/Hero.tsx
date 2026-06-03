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
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-20">
        <div className="animate-float-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            {dict.badge}
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            {dict.title}{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              {dict.titleAccent}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{dict.subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={localePath(locale, "/register")}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-pop transition hover:bg-brand-700"
            >
              {dict.ctaPrimary}
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 transition group-hover:translate-x-0.5">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-base font-semibold text-ink transition hover:border-brand-300"
            >
              {dict.ctaSecondary}
            </a>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              [dict.stat1, dict.stat1Label],
              [dict.stat2, dict.stat2Label],
              [dict.stat3, dict.stat3Label],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-extrabold tracking-tight text-ink">{value}</dt>
                <dd className="mt-1 text-sm text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-float-up [animation-delay:120ms]">
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  const rows = [
    { name: "Akmal Karimov", amount: "1 250 000", state: "ok" },
    { name: "Dilnoza Yusupova", amount: "640 000", state: "warn" },
    { name: "Sherzod Tosh", amount: "3 100 000", state: "over" },
    { name: "Madina Saidova", amount: "420 000", state: "ok" },
  ];
  const stateColor: Record<string, string> = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    over: "bg-rose-500",
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -right-6 -top-6 hidden rounded-2xl border border-line bg-white p-4 shadow-pop sm:block">
        <p className="text-xs font-medium text-muted">SMS sent</p>
        <p className="mt-1 text-sm font-semibold text-ink">Reminder delivered ✓</p>
      </div>

      <div className="rounded-card border border-line bg-white p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Total outstanding</p>
            <p className="text-3xl font-extrabold tracking-tight text-ink">5 410 000 so&apos;m</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M3 17l5-5 4 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 8h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {r.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                <p className="text-xs text-muted">{r.amount} so&apos;m</p>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${stateColor[r.state]}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
