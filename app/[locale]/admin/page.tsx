import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { formatPhone } from "@/lib/phone";
import { localePath } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  BalanceForm,
  BlockButton,
} from "@/components/admin/AdminControls";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.admin;

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);
  if (me.role !== "SUPERADMIN") redirect(`/${locale}/dashboard`);

  const { q } = await searchParams;
  const searchQuery = q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { phone: { contains: searchQuery } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      businesses: {
        select: {
          id: true,
          name: true,
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href={localePath(locale, "/dashboard")}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            {t.backToDashboard}
          </Link>
        </div>

        <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-ink">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{t.subtitle}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t.totalUsers} value={users.length} />
          <StatCard label={t.totalBusinesses} value={totals.businesses} />
          <StatCard label={t.totalCustomers} value={totals.customers} />
          <StatCard label={t.totalDebts} value={totals.debts} />
        </div>

        <form
          method="get"
          action={`/${locale}/admin`}
          className="mt-6 flex gap-2"
        >
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder={t.search}
            className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t.search.split(" ")[0]}
          </button>
          {searchQuery && (
            <Link
              href={`/${locale}/admin`}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              ✕
            </Link>
          )}
        </form>

        <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white shadow-soft">
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
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted">
                    {t.empty}
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const customers = u.businesses.reduce(
                  (s, b) => s + b._count.customers,
                  0
                );
                const debts = u.businesses.reduce(
                  (s, b) => s + b._count.debts,
                  0
                );
                return (
                  <tr
                    key={u.id}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${locale}/admin/${u.id}`}
                          className="font-medium text-ink hover:text-brand-700 hover:underline"
                        >
                          {u.name}
                        </Link>
                        {u.blocked && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            {t.blocked}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatPhone(u.phone)}
                    </td>
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
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {u.businesses.map((b) => (
                          <div key={b.id}>
                            <span className="tabular-nums">{b.smsBalance}</span>
                            <span className="ml-1 text-xs text-muted">
                              ({b.name})
                            </span>
                          </div>
                        ))}
                        <BalanceForm
                          businessId={u.businesses[0]?.id ?? ""}
                          dict={t}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {u.createdAt.toLocaleDateString(dateLocale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/${locale}/admin/${u.id}`}
                          className="rounded-lg bg-surface px-2.5 py-1 text-center text-xs font-semibold text-ink transition hover:bg-line"
                        >
                          {t.viewDetails}
                        </Link>
                        <BlockButton
                          userId={u.id}
                          isBlocked={u.blocked}
                          isSuperadmin={u.role === "SUPERADMIN"}
                          dict={t}
                        />
                      </div>
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
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}
