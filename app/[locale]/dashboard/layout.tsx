import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Sidebar } from "@/components/dashboard/Sidebar";

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

  return (
    <div className="min-h-screen bg-surface/50">
      <Sidebar locale={locale} nav={dict.dashboard.nav} />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 pt-20 sm:px-6 lg:pt-8">{children}</div>
      </div>
    </div>
  );
}
