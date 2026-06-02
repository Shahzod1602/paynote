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
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{dict.tagline}</p>
            <div className="mt-4 flex gap-2">
              {["telegram", "instagram", "facebook"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:border-brand-300 hover:text-brand-600"
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-ink">{dict.product}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><a href="#how" className="hover:text-brand-700">{dict.links.how}</a></li>
              <li><a href="#features" className="hover:text-brand-700">{dict.links.features}</a></li>
              <li><a href="#pricing" className="hover:text-brand-700">{dict.links.pricing}</a></li>
              <li><a href="#faq" className="hover:text-brand-700">{dict.links.faq}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-ink">{dict.company}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><a href="#" className="hover:text-brand-700">{dict.links.about}</a></li>
              <li><a href="#" className="hover:text-brand-700">{dict.links.blog}</a></li>
              <li><Link href={localePath(locale, "/login")} className="hover:text-brand-700">{dict.links.contactUs}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-ink">{dict.contact}</h4>
            <a href={`tel:${dict.phone.replace(/\s/g, "")}`} className="mt-4 block text-sm font-semibold text-ink hover:text-brand-700">
              {dict.phone}
            </a>
            <div className="mt-4 flex gap-2">
              <span className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted">App Store</span>
              <span className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted">Play Market</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <p>© {year} cash.identify.uz. {dict.rights}</p>
          <p>{dict.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
}
