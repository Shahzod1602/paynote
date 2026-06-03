import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveBusinessId } from "@/lib/user";
import { getServerCurrency } from "@/lib/currency";
import { getCustomerProfile } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";
import { localePath } from "@/lib/utils";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const d = dict.dashboard;
  const p = d.profile;

  const businessId = await getActiveBusinessId();
  if (!businessId) redirect(`/${locale}/login`);

  const [profile, currency] = await Promise.all([
    getCustomerProfile(businessId, id),
    getServerCurrency(),
  ]);

  if (!profile) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
        {p.notFound}
        <div className="mt-4">
          <Link href={localePath(locale, "/dashboard/customers")} className="font-semibold text-brand-700">
            ← {p.back}
          </Link>
        </div>
      </div>
    );
  }

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
  const msgBadge: Record<string, string> = {
    SENT: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-rose-50 text-rose-700",
    MOCK: "bg-slate-100 text-slate-600",
  };

  const stats = [
    { label: p.totalBorrowed, value: formatMoney(profile.totalBorrowed, currency), accent: "text-ink" },
    { label: p.totalPaid, value: formatMoney(profile.totalPaid, currency), accent: "text-emerald-600" },
    { label: p.outstanding, value: formatMoney(profile.balance, currency), accent: profile.balance > 0 ? "text-rose-600" : "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href={localePath(locale, "/dashboard/customers")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {p.back}
      </Link>

      {/* header card */}
      <div className="rounded-card border border-line bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-soft">
            {profile.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">{profile.name}</h1>
              <span className="rounded-md bg-surface px-2 py-1 font-mono text-xs font-semibold tracking-wide text-muted">
                #{profile.code}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span>{p.phone}: <span className="font-medium text-ink">{profile.phone || "—"}</span></span>
              {profile.telegramChatId && <span>{p.telegram}: <span className="font-medium text-ink">{profile.telegramChatId}</span></span>}
              <span>{p.memberSince}: <span className="font-medium text-ink">{formatDate(profile.createdAt)}</span></span>
            </div>
            {profile.note && <p className="mt-2 text-sm text-muted">{profile.note}</p>}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-surface/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
              <p className={`mt-1 text-xl font-extrabold tabular-nums tracking-tight ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* debts */}
      <div className="rounded-card border border-line bg-white shadow-soft">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">{p.debtsTitle}</h2>
        </div>
        {profile.debts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">{p.noDebts}</p>
        ) : (
          <div className="divide-y divide-line">
            {profile.debts.map((debt) => (
              <div key={debt.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{debt.note || "—"}</p>
                  <p className="text-xs text-muted">
                    {p.due}: {formatDate(debt.dueDate)} · {p.paid}: {formatMoney(debt.paid, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums text-ink">{formatMoney(debt.balance, currency)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[debt.status]}`}>
                    {statusLabel[debt.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* messages */}
      <div className="rounded-card border border-line bg-white shadow-soft">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">{p.messagesTitle}</h2>
        </div>
        {profile.messages.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">{p.noMessages}</p>
        ) : (
          <div className="divide-y divide-line">
            {profile.messages.map((m) => (
              <div key={m.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${msgBadge[m.status]}`}>
                  {m.channel}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{m.text}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(m.createdAt)} · {m.recipient}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
