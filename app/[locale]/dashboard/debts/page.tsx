import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getDebts, getCustomers, getApprovedTemplates } from "@/lib/queries";
import { DebtsClient } from "@/components/dashboard/DebtsClient";

export default async function DebtsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.dashboard;

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const [debts, customers, templates] = await Promise.all([
    getDebts(businessId),
    getCustomers(businessId),
    getApprovedTemplates(businessId),
  ]);

  return (
    <DebtsClient
      locale={locale}
      debts={debts}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      templates={templates}
      title={d.debtsTitle}
      addLabel={d.addDebt}
      emptyLabel={d.empty}
      table={d.table}
      status={d.status}
      form={d.form}
    />
  );
}
