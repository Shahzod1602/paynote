import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getServerCurrency } from "@/lib/currency";
import { getDebtsGrouped, getCustomers, getApprovedTemplates, getProducts } from "@/lib/queries";
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

  const [debts, customers, templates, products, currency] = await Promise.all([
    getDebtsGrouped(businessId),
    getCustomers(businessId),
    getApprovedTemplates(businessId),
    getProducts(businessId),
    getServerCurrency(),
  ]);

  return (
    <DebtsClient
      locale={locale}
      debts={debts}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      templates={templates}
      products={products}
      productSelectLabel={d.products.select}
      productNoneLabel={d.products.selectNone}
      currency={currency}
      title={d.debtsTitle}
      addLabel={d.addDebt}
      emptyLabel={d.empty}
      table={d.table}
      status={d.status}
      form={d.form}
    />
  );
}
