import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { formatPhone } from "@/lib/phone";
import { Logo } from "@/components/Logo";
import {
  BalanceForm,
  BlockButton,
} from "@/components/admin/AdminControls";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.admin;

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me.role !== "SUPERADMIN") redirect(`/${locale}/dashboard`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { customers: true, debts: true, templates: true } },
          balanceLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { admin: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!user) notFound();

  const dateLocale = locale === "uz" ? "uz-UZ" : "en-US";
  const totalCustomers = user.businesses.reduce(
    (s, b) => s + b._count.customers,
    0
  );
  const totalDebts = user.businesses.reduce((s, b) => s + b._count.debts, 0);

  return (
    <div className="min-h-screen bg-surface/50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href={`/${locale}/admin`}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            ← {t.adminPanel}
          </Link>
        </div>

        <div className="mt-8 rounded-card border border-line bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                  {user.name}
                </h1>
                {user.blocked && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {t.blocked}
                  </span>
                )}
                {user.role === "SUPERADMIN" && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    SUPERADMIN
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {formatPhone(user.phone)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {t.createdAt}:{" "}
                {user.createdAt.toLocaleDateString(dateLocale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <BlockButton
              userId={user.id}
              isBlocked={user.blocked}
              isSuperadmin={user.role === "SUPERADMIN"}
              dict={t}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label={t.totalBusinesses} value={user.businesses.length} />
            <StatCard label={t.totalCustomers} value={totalCustomers} />
            <StatCard label={t.totalDebts} value={totalDebts} />
          </div>
        </div>

        <h2 className="mt-8 text-lg font-bold text-ink">{t.businesses}</h2>
        <div className="mt-3 space-y-4">
          {user.businesses.map((b) => (
            <div
              key={b.id}
              className="rounded-card border border-line bg-white p-5 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-ink">{b.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {b._count.customers} {t.customers} · {b._count.debts}{" "}
                    {t.debts} · {b._count.templates} templates
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold tabular-nums text-ink">
                    {b.smsBalance}
                  </p>
                  <p className="text-xs text-muted">{t.smsBalance}</p>
                </div>
              </div>
              <div className="mt-3">
                <BalanceForm
                  businessId={b.id}
                  dict={t}
                />
              </div>

              {b.balanceLogs.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t.balanceHistory}
                  </p>
                  <div className="mt-2 space-y-1">
                    {b.balanceLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-lg bg-surface/50 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold tabular-nums ${
                              log.amount > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {log.amount > 0 ? "+" : ""}
                            {log.amount}
                          </span>
                          {log.note && (
                            <span className="text-xs text-muted">
                              {log.note}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>{log.admin.name}</span>
                          <span>
                            {log.createdAt.toLocaleDateString(dateLocale, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface/50 p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}
