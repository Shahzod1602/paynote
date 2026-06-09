import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { formatPhone } from "@/lib/phone";
import { localePath } from "@/lib/utils";
import { Logo } from "@/components/Logo";

// Superadmin: barcha hisoblar ro'yxati va umumiy statistika.
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.admin;

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me.role !== "SUPERADMIN") redirect(`/${locale}/dashboard`);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      businesses: {
        select: {
          smsBalance: true,
          _count: { select: { customers: true, debts: true } },
        },
      },
    },
  });

  const totals = users.reduce(
    (acc, u) => {
      acc.businesses += u.businesses.length;
      for (const b of u.businesses) {
        acc.customers += b._count.customers;
        acc.debts += b._count.debts;
      }
      return acc;
    },
    { businesses: 0, customers: 0, debts: 0 }
  );

  const dateLocale = locale === "uz" ? "uz-UZ" : "en-US";

  return (
    <div className="min-h-screen bg-surface/50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href={localePath(locale, "/dashboard")}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            {t.backToDashboard}
          </Link>
        </div>

        <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.subtitle}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t.totalUsers} value={users.length} />
          <StatCard label={t.totalBusinesses} value={totals.businesses} />
          <StatCard label={t.totalCustomers} value={totals.customers} />
          <StatCard label={t.totalDebts} value={totals.debts} />
        </div>

        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">{t.name}</th>
                <th className="px-4 py-3 font-semibold">{t.phone}</th>
                <th className="px-4 py-3 font-semibold">{t.role}</th>
                <th className="px-4 py-3 font-semibold">{t.customers}</th>
                <th className="px-4 py-3 font-semibold">{t.debts}</th>
                <th className="px-4 py-3 font-semibold">{t.smsBalance}</th>
                <th className="px-4 py-3 font-semibold">{t.createdAt}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted">
                    {t.empty}
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const customers = u.businesses.reduce((s, b) => s + b._count.customers, 0);
                const debts = u.businesses.reduce((s, b) => s + b._count.debts, 0);
                const smsBalance = u.businesses.reduce((s, b) => s + b.smsBalance, 0);
                return (
                  <tr key={u.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                    <td className="px-4 py-3 text-muted">{formatPhone(u.phone)}</td>
                    <td className="px-4 py-3">
                      {u.role === "SUPERADMIN" ? (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          SUPERADMIN
                        </span>
                      ) : (
                        <span className="text-muted">USER</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{customers}</td>
                    <td className="px-4 py-3 tabular-nums">{debts}</td>
                    <td className="px-4 py-3 tabular-nums">{smsBalance}</td>
                    <td className="px-4 py-3 text-muted">
                      {u.createdAt.toLocaleDateString(dateLocale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-soft">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
    </div>
  );
}
