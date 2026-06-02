import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getTemplates } from "@/lib/queries";
import { TemplatesClient } from "@/components/dashboard/TemplatesClient";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const templates = await getTemplates(businessId);

  return <TemplatesClient locale={locale} templates={templates} dict={dict.dashboard.templates} />;
}
