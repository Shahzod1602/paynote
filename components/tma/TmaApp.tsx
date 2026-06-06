"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "./useTelegram";
import { AuthGate } from "./AuthGate";
import { getStrings, pickLocale } from "./strings";
import { HomeScreen, CustomersScreen, CustomerScreen, type HomeData } from "./screens";
import { AddDebtSheet, PaymentSheet, ReminderSheet } from "./sheets";
import { Spinner } from "./ui";
import type { CustomerProfile } from "@/lib/queries";

type Tab = "home" | "customers";

type SheetState =
  | { kind: "none" }
  | { kind: "addDebt"; customerId?: string }
  | { kind: "payment"; customerId: string; name: string; balance: number }
  | { kind: "reminder"; debtId: string; name: string; balance: number };

export function TmaApp() {
  const { ready, user, setBackButton } = useTelegram();
  const locale = pickLocale(user?.language_code);
  const s = getStrings(locale);

  const [authed, setAuthed] = useState(false);
  const [home, setHome] = useState<HomeData | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });

  const loadHome = useCallback(async () => {
    const r = await fetch("/api/tma/data", { cache: "no-store" });
    if (r.status === 401) {
      setAuthed(false); // session lost (e.g. ephemeral webview cookie) → re-bootstrap
      return;
    }
    if (r.ok) setHome(await r.json());
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    try {
      const r = await fetch(`/api/tma/data/customer?id=${id}`, { cache: "no-store" });
      setProfile(r.ok ? (await r.json()).profile : null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([loadHome(), detailId ? loadProfile(detailId) : Promise.resolve()]);
  }, [loadHome, loadProfile, detailId]);

  const onAuthed = useCallback(() => {
    setAuthed(true);
    void loadHome();
  }, [loadHome]);

  // Open/close a customer detail — profile is loaded from the event, not an effect.
  const openCustomer = useCallback(
    (id: string) => {
      setDetailId(id);
      void loadProfile(id);
    },
    [loadProfile]
  );
  const closeDetail = useCallback(() => {
    setDetailId(null);
    setProfile(null);
  }, []);

  // Telegram BackButton: closes a sheet first, then the detail screen.
  useEffect(() => {
    if (sheet.kind !== "none") setBackButton(true, () => setSheet({ kind: "none" }));
    else if (detailId) setBackButton(true, closeDetail);
    else setBackButton(false);
  }, [sheet, detailId, setBackButton, closeDetail]);

  const closeSheet = () => setSheet({ kind: "none" });

  if (!ready) {
    return (
      <div className="tma-app flex min-h-screen items-center justify-center">
        <Spinner className="tma-accent h-7 w-7" />
      </div>
    );
  }

  if (!authed) return <AuthGate onAuthed={onAuthed} />;

  if (!home) {
    return (
      <div className="tma-app flex min-h-screen items-center justify-center">
        <Spinner className="tma-accent h-7 w-7" />
      </div>
    );
  }

  const userName = user?.first_name ?? user?.username ?? "";

  const sheets = (
    <>
      <AddDebtSheet
        open={sheet.kind === "addDebt"}
        onClose={closeSheet}
        onDone={reload}
        locale={locale}
        s={s}
        customers={home.customers}
        presetCustomerId={sheet.kind === "addDebt" ? sheet.customerId : undefined}
      />
      {sheet.kind === "payment" && (
        <PaymentSheet
          open
          onClose={closeSheet}
          onDone={reload}
          locale={locale}
          s={s}
          customerId={sheet.customerId}
          name={sheet.name}
          balance={sheet.balance}
        />
      )}
      {sheet.kind === "reminder" && (
        <ReminderSheet
          open
          onClose={closeSheet}
          onDone={reload}
          locale={locale}
          s={s}
          debtId={sheet.debtId}
          name={sheet.name}
          balance={sheet.balance}
          templates={home.templates}
        />
      )}
    </>
  );

  const openPay = (customerId: string, name: string, balance: number) =>
    setSheet({ kind: "payment", customerId, name, balance });
  const openRemind = (debtId: string, name: string, balance: number) =>
    setSheet({ kind: "reminder", debtId, name, balance });

  // Pushed customer detail (covers tabs; BackButton returns).
  if (detailId) {
    return (
      <main className="tma-app min-h-screen">
        <CustomerScreen
          s={s}
          profile={profile}
          loading={profileLoading}
          onAddDebt={(customerId) => setSheet({ kind: "addDebt", customerId })}
          onPay={openPay}
          onRemind={openRemind}
        />
        {sheets}
      </main>
    );
  }

  return (
    <main className="tma-app min-h-screen">
      {tab === "home" ? (
        <HomeScreen
          s={s}
          userName={userName}
          data={home}
          onOpenCustomer={openCustomer}
          onAddDebt={() => setSheet({ kind: "addDebt" })}
          onPay={openPay}
          onRemind={openRemind}
        />
      ) : (
        <CustomersScreen s={s} customers={home.customers} onOpenCustomer={openCustomer} />
      )}

      <TabBar tab={tab} onTab={setTab} s={s} />
      {sheets}
    </main>
  );
}

function TabBar({ tab, onTab, s }: { tab: Tab; onTab: (t: Tab) => void; s: ReturnType<typeof getStrings> }) {
  return (
    <nav
      className="tma-card fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <TabButton active={tab === "home"} onClick={() => onTab("home")} label={s.tabHome}>
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M3 11 12 4l9 7M5 10v9h14v-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </TabButton>
      <TabButton active={tab === "customers"} onClick={() => onTab("customers")} label={s.tabCustomers}>
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.8M20.5 19a5.5 5.5 0 0 0-3.4-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </TabButton>
    </nav>
  );
}

function TabButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition"
      style={{ color: active ? "var(--tg-button)" : "var(--tg-hint)" }}
    >
      {children}
      {label}
    </button>
  );
}
