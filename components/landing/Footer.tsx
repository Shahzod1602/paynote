import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";

type FooterDict = {
  tagline: string;
  product: string;
  company: string;
  contact: string;
  links: {
    how: string;
    features: string;
    pricing: string;
    faq: string;
    blog: string;
    about: string;
    contactUs: string;
  };
  phone: string;
  rights: string;
  poweredBy: string;
};

export function Footer({ locale, dict }: { locale: Locale; dict: FooterDict }) {
  const year = 2026;
  return (
    <footer className="border-t border-rule bg-paper-2">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ledger-soft">{dict.tagline}</p>
            <div className="mt-5 flex gap-2">
              {["telegram", "instagram", "facebook"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="grid h-9 w-9 place-items-center rounded-full border border-rule text-ledger-soft transition hover:border-leaf/40 hover:text-leaf"
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-ledger">{dict.product}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ledger-soft">
              <li><a href="#how" className="transition hover:text-leaf">{dict.links.how}</a></li>
              <li><a href="#features" className="transition hover:text-leaf">{dict.links.features}</a></li>
              <li><a href="#pricing" className="transition hover:text-leaf">{dict.links.pricing}</a></li>
              <li><a href="#faq" className="transition hover:text-leaf">{dict.links.faq}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-ledger">{dict.company}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ledger-soft">
              <li><a href="#" className="transition hover:text-leaf">{dict.links.about}</a></li>
              <li><a href="#" className="transition hover:text-leaf">{dict.links.blog}</a></li>
              <li><Link href={localePath(locale, "/login")} className="transition hover:text-leaf">{dict.links.contactUs}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-ledger">{dict.contact}</h4>
            <a href={`tel:${dict.phone.replace(/\s/g, "")}`} className="mt-4 block text-sm font-semibold text-ledger transition hover:text-leaf">
              {dict.phone}
            </a>
            <div className="mt-4 flex gap-2">
              <span className="rounded-lg border border-rule px-3 py-2 text-xs font-medium text-ledger-soft">App Store</span>
              <span className="rounded-lg border border-rule px-3 py-2 text-xs font-medium text-ledger-soft">Play Market</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-rule pt-6 text-sm text-ledger-soft sm:flex-row">
          <p>© {year} Paynote. {dict.rights}</p>
          <p>{dict.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
}
