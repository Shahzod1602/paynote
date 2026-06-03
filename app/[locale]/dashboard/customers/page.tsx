import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getServerCurrency } from "@/lib/currency";
import { getCustomers } from "@/lib/queries";
import { CustomersClient } from "@/components/dashboard/CustomersClient";

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.dashboard;

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const [customers, currency] = await Promise.all([getCustomers(businessId), getServerCurrency()]);

  return (
    <CustomersClient
      locale={locale}
      customers={customers}
      title={d.customersTitle}
      addLabel={d.addCustomer}
      amountLabel={d.table.amount}
      emptyLabel={d.empty}
      searchPlaceholder={d.topbar.search}
      noResults={d.form.noResults}
      currency={currency}
      initialQuery={q ?? ""}
      form={d.form}
    />
  );
}
