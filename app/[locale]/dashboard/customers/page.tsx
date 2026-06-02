import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getCustomers } from "@/lib/queries";
import { CustomersClient } from "@/components/dashboard/CustomersClient";

export default async function CustomersPage({
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

  const customers = await getCustomers(businessId);

  return (
    <CustomersClient
      locale={locale}
      customers={customers}
      title={d.customersTitle}
      addLabel={d.addCustomer}
      amountLabel={d.table.amount}
      emptyLabel={d.empty}
      form={d.form}
    />
  );
}
