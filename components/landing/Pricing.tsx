import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localePath, cn } from "@/lib/utils";
import { Eyebrow } from "./Steps";

type Plan = {
  name: string;
  price: string;
  desc: string;
  popular?: boolean;
  features: string[];
};

type PricingDict = {
  title: string;
  subtitle: string;
  perMonth: string;
  popular: string;
  cta: string;
  ctaContact: string;
  plans: Plan[];
};

export function Pricing({ locale, dict }: { locale: Locale; dict: PricingDict }) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Narxlar</Eyebrow>
        <h2 className="mt-4 font-display text-[2.1rem] font-semibold tracking-tight text-ledger sm:text-[2.6rem]">
          {dict.title}
        </h2>
        <p className="mt-3 text-lg text-ledger-soft">{dict.subtitle}</p>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {dict.plans.map((plan) => {
          const paid = plan.price.startsWith("$") && plan.price !== "$0";
          const isCustom = !plan.price.startsWith("$");
          return (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-paper-2 p-5 transition",
                plan.popular
                  ? "border-gold bg-paper shadow-ledger lg:-mt-4 lg:mb-4 ring-1 ring-gold/30"
                  : "border-rule hover:border-leaf/40 hover:bg-paper"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-xs font-semibold text-paper shadow-[0_8px_18px_-10px_rgba(168,122,28,0.9)]">
                  {dict.popular}
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-ledger">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-[2.2rem] font-semibold tabular-nums tracking-tight text-ledger">
                  {plan.price}
                </span>
                {paid && <span className="text-sm text-ledger-soft">{dict.perMonth}</span>}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ledger-soft">{plan.desc}</p>

              <ul className="mt-5 flex-1 space-y-2.5 border-t border-rule pt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ledger">
                    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-leaf">
                      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={localePath(locale, "/register")}
                className={cn(
                  "mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition",
                  plan.popular
                    ? "bg-leaf text-paper shadow-[0_10px_22px_-12px_rgba(28,107,74,0.9)] hover:bg-leaf-600"
                    : "border border-ledger/15 text-ledger hover:border-leaf/40 hover:text-leaf"
                )}
              >
                {isCustom ? dict.ctaContact : dict.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
