import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Steps } from "@/components/landing/Steps";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { CtaBand } from "@/components/landing/CtaBand";
import { Footer } from "@/components/landing/Footer";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <>
      <Header locale={locale} nav={dict.nav} />
      <main>
        <Hero locale={locale} dict={dict.hero} />
        <Steps dict={dict.steps} />
        <Features dict={dict.features} />
        <Pricing locale={locale} dict={dict.pricing} />
        <Faq dict={dict.faq} />
        <CtaBand locale={locale} dict={dict.cta} />
      </main>
      <Footer locale={locale} dict={dict.footer} />
    </>
  );
}
