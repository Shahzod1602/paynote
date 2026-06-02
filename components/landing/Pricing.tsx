import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localePath, cn } from "@/lib/utils";

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
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{dict.title}</h2>
        <p className="mt-3 text-lg text-muted">{dict.subtitle}</p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {dict.plans.map((plan) => {
          const paid = plan.price.startsWith("$") && plan.price !== "$0";
          const isCustom = !plan.price.startsWith("$");
          return (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-card border bg-white p-5 shadow-soft transition",
                plan.popular ? "border-brand-500 shadow-pop lg:-mt-3 lg:mb-3" : "border-line hover:border-brand-200"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-soft">
                  {dict.popular}
                </span>
              )}
              <h3 className="text-base font-bold text-ink">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-ink">{plan.price}</span>
                {paid && <span className="text-sm text-muted">{dict.perMonth}</span>}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{plan.desc}</p>

              <ul className="mt-4 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={localePath(locale, "/register")}
                className={cn(
                  "mt-5 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition",
                  plan.popular
                    ? "bg-brand-600 text-white shadow-soft hover:bg-brand-700"
                    : "border border-line text-ink hover:border-brand-300 hover:text-brand-700"
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
