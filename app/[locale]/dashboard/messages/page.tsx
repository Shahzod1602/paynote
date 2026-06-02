import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getMessageLogs, getSmsBalance } from "@/lib/queries";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const m = dict.dashboard.messages;

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const [logs, balance] = await Promise.all([
    getMessageLogs(businessId),
    getSmsBalance(businessId),
  ]);

  const statusBadge: Record<string, string> = {
    SENT: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-rose-50 text-rose-700",
    MOCK: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{m.title}</h1>
          <p className="mt-1 text-sm text-muted">{m.subtitle}</p>
        </div>
        <div className="rounded-card border border-line bg-white px-5 py-3 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-muted">{m.balanceLabel}</p>
          <p className={`mt-1 text-2xl font-extrabold tracking-tight ${balance <= 5 ? "text-rose-600" : "text-ink"}`}>
            {balance} <span className="text-sm font-medium text-muted">{m.balanceUnit}</span>
          </p>
          {balance <= 5 && <p className="mt-1 text-xs text-rose-600">{m.balanceLow}</p>}
        </div>
      </div>

      <div className="rounded-card border border-line bg-white shadow-soft">
        {logs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">{m.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">{m.table.date}</th>
                  <th className="px-5 py-3 font-medium">{m.table.customer}</th>
                  <th className="px-5 py-3 font-medium">{m.table.channel}</th>
                  <th className="px-5 py-3 font-medium">{m.table.recipient}</th>
                  <th className="px-5 py-3 font-medium">{m.table.status}</th>
                  <th className="px-5 py-3 font-medium">{m.table.text}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-5 py-3.5 text-muted">{formatDateTime(log.createdAt)}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">{log.customerName ?? "—"}</td>
                    <td className="px-5 py-3.5 text-muted">{log.channel}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-muted">{log.recipient}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[log.status]}`}>
                        {m.status[log.status]}
                      </span>
                      {log.error && <p className="mt-1 text-xs text-rose-500">{log.error}</p>}
                    </td>
                    <td className="max-w-xs px-5 py-3.5 text-muted">{log.text}</td>
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
