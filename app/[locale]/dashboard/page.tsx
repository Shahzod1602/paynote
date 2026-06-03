import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/user";
import { getDashboardStats, getRecentDebts } from "@/lib/queries";
import { getServerCurrency } from "@/lib/currency";
import { formatMoney, formatDate } from "@/lib/format";

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.dashboard;

  const user = await getCurrentUser();
  const businessId = user?.businesses[0]?.id;
  if (!user || !businessId) redirect(`/${locale}/login`);

  const [stats, recent, currency] = await Promise.all([
    getDashboardStats(businessId),
    getRecentDebts(businessId, 6),
    getServerCurrency(),
  ]);

  const cards = [
    { label: d.stats.totalDebt, value: formatMoney(stats.totalOutstanding, currency), accent: "text-ink" },
    { label: d.stats.customers, value: String(stats.customers), accent: "text-ink" },
    { label: d.stats.overdue, value: formatMoney(stats.overdue, currency), accent: "text-rose-600" },
    { label: d.stats.collected, value: formatMoney(stats.collectedThisMonth, currency), accent: "text-emerald-600" },
  ];

  const badge: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    OVERDUE: "bg-rose-50 text-rose-700",
  };
  const statusLabel: Record<string, string> = {
    PAID: d.status.paid,
    PENDING: d.status.pending,
    OVERDUE: d.status.overdue,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{d.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {d.welcome}, {user.name} 👋
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.label} className="rounded-card border border-line bg-white p-5 shadow-soft">
            <p className="text-sm text-muted">{s.label}</p>
            <p className={`mt-2 text-2xl font-extrabold tracking-tight ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-line bg-white shadow-soft">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">{d.recent}</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">{d.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">{d.table.customer}</th>
                  <th className="px-5 py-3 font-medium">{d.table.amount}</th>
                  <th className="px-5 py-3 font-medium">{d.table.due}</th>
                  <th className="px-5 py-3 font-medium">{d.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {r.customerName.charAt(0)}
                        </span>
                        <span className="font-medium text-ink">{r.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{formatMoney(r.balance, currency)}</td>
                    <td className="px-5 py-3.5 text-muted">{formatDate(r.dueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
