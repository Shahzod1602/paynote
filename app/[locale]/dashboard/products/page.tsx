import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getServerCurrency } from "@/lib/currency";
import { getProducts } from "@/lib/queries";
import { ProductsClient } from "@/components/dashboard/ProductsClient";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const [products, currency] = await Promise.all([getProducts(businessId), getServerCurrency()]);

  return <ProductsClient locale={locale} products={products} currency={currency} dict={dict.dashboard.products} />;
}
