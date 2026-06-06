import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getServerCurrency } from "@/lib/currency";
import { getMonthlyReport } from "@/lib/queries";
import { formatMoney } from "@/lib/format";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const r = dict.dashboard.reports;

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const [data, currency] = await Promise.all([getMonthlyReport(businessId, 12), getServerCurrency()]);

  const max = Math.max(1, ...data.map((d) => Math.max(d.borrowed, d.paid)));
  const totals = data.reduce(
    (acc, d) => ({ borrowed: acc.borrowed + d.borrowed, paid: acc.paid + d.paid }),
    { borrowed: 0, paid: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{r.title}</h1>
        <p className="mt-1 text-sm text-muted">{r.subtitle}</p>
      </div>

      {/* Chart */}
      <div className="rounded-card border border-line bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">{r.chartTitle}</h2>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> {r.borrowed}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> {r.paid}
            </span>
          </div>
        </div>

        <div className="flex h-48 items-stretch gap-2 overflow-x-auto pb-1">
          {data.map((d) => (
            <div key={d.key} className="flex h-full min-w-[34px] flex-1 flex-col items-center gap-1.5">
              <div className="flex min-h-0 w-full flex-1 items-end justify-center gap-1">
                <div
                  className="w-1/2 max-w-[14px] rounded-t bg-brand-500 transition-all"
                  style={{ height: `${(d.borrowed / max) * 100}%` }}
                  title={`${r.borrowed}: ${formatMoney(d.borrowed, currency)}`}
                />
                <div
                  className="w-1/2 max-w-[14px] rounded-t bg-emerald-500 transition-all"
                  style={{ height: `${(d.paid / max) * 100}%` }}
                  title={`${r.paid}: ${formatMoney(d.paid, currency)}`}
                />
              </div>
              <span className="text-[0.65rem] tabular-nums text-muted">{d.key.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Excel-like table with auto totals */}
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">{r.month}</th>
                <th className="px-5 py-3 text-right font-medium">{r.borrowed}</th>
                <th className="px-5 py-3 text-right font-medium">{r.paid}</th>
                <th className="px-5 py-3 text-right font-medium">{r.net}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key} className="border-t border-line">
                  <td className="px-5 py-3 font-medium tabular-nums text-ink">{d.key}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink">{formatMoney(d.borrowed, currency)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-emerald-600">{formatMoney(d.paid, currency)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted">{formatMoney(d.borrowed - d.paid, currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-surface/50 font-bold">
                <td className="px-5 py-3 text-ink">{r.total}</td>
                <td className="px-5 py-3 text-right tabular-nums text-ink">{formatMoney(totals.borrowed, currency)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-emerald-600">{formatMoney(totals.paid, currency)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-ink">{formatMoney(totals.borrowed - totals.paid, currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
