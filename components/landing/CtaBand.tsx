import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";

type CtaDict = {
  title: string;
  subtitle: string;
  button: string;
  appStore: string;
  playMarket: string;
};

export function CtaBand({ locale, dict }: { locale: Locale; dict: CtaDict }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-leaf-600 px-6 py-16 text-center shadow-[0_30px_60px_-30px_rgba(21,88,60,0.9)] sm:px-12">
        {/* ledger rule texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(244,236,218,0.7) 31px, rgba(244,236,218,0.7) 32px)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-leaf/40 blur-3xl" aria-hidden />

        {/* corner stamp */}
        <span className="absolute right-6 top-6 hidden h-16 w-16 -rotate-12 place-items-center rounded-full border-2 border-gold-soft/50 text-gold-soft md:grid">
          <span className="font-display text-[0.55rem] font-bold uppercase leading-tight tracking-[0.15em] text-center">
            Est.<br />2026
          </span>
        </span>

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-[2.1rem] font-semibold tracking-tight text-paper sm:text-[2.7rem]">
            {dict.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-paper/80">{dict.subtitle}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={localePath(locale, "/register")}
              className="rounded-full bg-paper px-8 py-4 text-base font-semibold text-leaf-600 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.5)] transition hover:bg-paper-2"
            >
              {dict.button}
            </Link>
            <div className="flex gap-3">
              <StoreBadge label={dict.appStore} sub="Download on the" />
              <StoreBadge label={dict.playMarket} sub="Get it on" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoreBadge({ label, sub }: { label: string; sub: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-paper/25 bg-paper/10 px-4 py-3 text-left text-paper backdrop-blur transition hover:bg-paper/20">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M16.5 2c.1 1.1-.3 2.2-1 3-.7.8-1.8 1.4-2.9 1.3-.1-1.1.4-2.2 1-2.9C14.4 2.6 15.5 2 16.5 2zM20 17.3c-.5 1.2-.8 1.7-1.4 2.7-.9 1.4-2.1 3.1-3.6 3.1-1.3 0-1.7-.9-3.5-.9s-2.2.8-3.5.9c-1.5.1-2.6-1.5-3.5-2.9C2 18.1 1.2 14.5 2.7 12c.8-1.4 2.2-2.3 3.7-2.3 1.4 0 2.3.9 3.5.9 1.1 0 1.8-.9 3.5-.9 1.3 0 2.6.7 3.6 1.9-3.1 1.7-2.6 6.1.5 7.7z" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[10px] opacity-80">{sub}</span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
    </span>
  );
}
