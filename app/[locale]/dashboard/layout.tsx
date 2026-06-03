import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/user";
import { getServerCurrency } from "@/lib/currency";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  const business = user?.businesses[0];
  if (!user || !business) redirect(`/${locale}/login`);

  const currency = await getServerCurrency();
  const t = dict.dashboard.topbar;

  return (
    <div className="min-h-screen bg-surface/50">
      <Sidebar locale={locale} nav={dict.dashboard.nav} />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Topbar
            locale={locale}
            currency={currency}
            userName={user.name}
            businessName={business.name}
            phone={user.phone}
            smsBalance={business.smsBalance}
            dict={{
              search: t.search,
              wallet: t.wallet,
              myAccount: t.myAccount,
              business: t.business,
              logout: dict.dashboard.nav.logout,
            }}
          />
          <div className="pb-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
