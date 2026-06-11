"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteProduct } from "@/lib/actions/products";
import type { CustomerProfile } from "@/lib/queries";
import { useTelegram } from "./useTelegram";
import { AuthGate } from "./AuthGate";
import { PrefsProvider, usePrefs } from "./prefs";
import { getStrings, pickLocale } from "./strings";
import {
  HomeScreen,
  CustomersScreen,
  CustomerScreen,
  DebtsScreen,
  ProductsScreen,
  TemplatesScreen,
  SmsScreen,
  ReportsScreen,
  SettingsScreen,
  ProfileCard,
  LogoutButton,
  SearchIcon,
  type HomeData,
} from "./screens";
import {
  AddDebtSheet,
  PaymentSheet,
  ReminderSheet,
  ProductSheet,
  TemplateSheet,
} from "./sheets";
import { Sheet, Spinner } from "./ui";

type Tab =
  | "home"
  | "debts"
  | "customers"
  | "products"
  | "templates"
  | "sms"
  | "reports"
  | "settings";

type SheetState =
  | { kind: "none" }
  | { kind: "addDebt"; customerId?: string }
  | { kind: "payment"; customerId: string; name: string; balance: number }
  | { kind: "reminder"; debtId: string; name: string; balance: number }
  | { kind: "addProduct" }
  | { kind: "addTemplate" }
  | { kind: "profile" };

export function TmaApp() {
  return (
    <PrefsProvider>
      <TmaAppInner />
    </PrefsProvider>
  );
}

function TmaAppInner() {
  const { ready, user, setBackButton, haptic, confirmDialog } = useTelegram();
  const { localePref } = usePrefs();
  const locale = localePref === "auto" ? pickLocale(user?.language_code) : localePref;
  const s = getStrings(locale);

  const [authed, setAuthed] = useState(false);
  const [home, setHome] = useState<HomeData | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });
  const [searchSignal, setSearchSignal] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Header actions
  const goSearch = useCallback(() => {
    setTab("customers");
    setSearchSignal((n) => n + 1);
  }, []);

  const logout = useCallback(() => {
    setLoggingOut(true);
    void (async () => {
      try {
        await fetch("/api/tma/logout", { method: "POST" });
      } finally {
        // Telegram is unlinked now — a fresh bootstrap lands on the link screen.
        window.location.reload();
      }
    })();
  }, []);

  const onDeleteProduct = useCallback(
    (id: string) => {
      void (async () => {
        if (!(await confirmDialog(s.confirmDelete))) return;
        const fd = new FormData();
        fd.set("id", id);
        fd.set("locale", locale);
        const res = await deleteProduct(fd);
        if (res.ok) {
          haptic("success");
          void loadHome();
        } else {
          haptic("error");
        }
      })();
    },
    [confirmDialog, s.confirmDelete, locale, haptic, loadHome]
  );

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
      <ProductSheet
        open={sheet.kind === "addProduct"}
        onClose={closeSheet}
        onDone={reload}
        locale={locale}
        s={s}
      />
      <TemplateSheet
        open={sheet.kind === "addTemplate"}
        onClose={closeSheet}
        onDone={reload}
        locale={locale}
        s={s}
      />
      <Sheet open={sheet.kind === "profile"} onClose={closeSheet} title={home.me.name}>
        <div className="space-y-3">
          <ProfileCard s={s} me={home.me} />
          <LogoutButton s={s} onLogout={logout} loggingOut={loggingOut} />
        </div>
      </Sheet>
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
      <Header
        smsBalance={home.me.smsBalance}
        name={home.me.name}
        onSearch={goSearch}
        onSms={() => setTab("sms")}
        onProfile={() => setSheet({ kind: "profile" })}
      />

      {tab === "home" && <HomeScreen s={s} userName={home.me.name} data={home} />}
      {tab === "debts" && (
        <DebtsScreen
          s={s}
          debts={home.allDebts}
          onOpenCustomer={openCustomer}
          onPay={openPay}
          onRemind={openRemind}
        />
      )}
      {tab === "customers" && (
        <CustomersScreen
          s={s}
          customers={home.customers}
          onOpenCustomer={openCustomer}
          onAddDebt={() => setSheet({ kind: "addDebt" })}
          searchFocusSignal={searchSignal}
        />
      )}
      {tab === "products" && (
        <ProductsScreen
          s={s}
          products={home.products}
          onAdd={() => setSheet({ kind: "addProduct" })}
          onDelete={onDeleteProduct}
        />
      )}
      {tab === "templates" && (
        <TemplatesScreen s={s} templates={home.templatesAll} onAdd={() => setSheet({ kind: "addTemplate" })} />
      )}
      {tab === "sms" && <SmsScreen s={s} balance={home.me.smsBalance} messages={home.messages} />}
      {tab === "reports" && <ReportsScreen s={s} monthly={home.monthly} />}
      {tab === "settings" && (
        <SettingsScreen s={s} me={home.me} onLogout={logout} loggingOut={loggingOut} />
      )}

      <TabBar tab={tab} onTab={setTab} s={s} />
      {sheets}
    </main>
  );
}

// ── Header: search + SMS balance + currency + profile (web Topbar parity) ────
function Header({
  smsBalance,
  name,
  onSearch,
  onSms,
  onProfile,
}: {
  smsBalance: number;
  name: string;
  onSearch: () => void;
  onSms: () => void;
  onProfile: () => void;
}) {
  const { currency, setCurrency } = usePrefs();
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <header
      className="tma-sep sticky top-0 z-30 border-b px-3 py-2"
      style={{ background: "var(--tg-secondary-bg)" }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onSearch}
          aria-label="search"
          className="tma-card tma-hint grid h-9 w-9 shrink-0 place-items-center rounded-full border transition active:scale-95"
        >
          <SearchIcon />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSms}
            className="tma-card flex h-9 items-center gap-1.5 rounded-full border px-3 transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-emerald-600">
              <path d="M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="tma-text text-sm font-bold tabular-nums">{smsBalance}</span>
            <span className="tma-hint text-xs">SMS</span>
          </button>

          <div className="tma-card flex h-9 items-center rounded-full border p-0.5 text-xs font-semibold">
            {(["UZS", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex h-full items-center rounded-full px-2.5 transition ${currency === c ? "tma-btn" : "tma-hint"}`}
              >
                {c === "UZS" ? "so‘m" : "USD"}
              </button>
            ))}
          </div>

          <button
            onClick={onProfile}
            aria-label="profile"
            className="tma-btn grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition active:scale-95"
          >
            {initial}
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Bottom navigation: every section as its own page, bank-app style ─────────
function TabBar({ tab, onTab, s }: { tab: Tab; onTab: (t: Tab) => void; s: ReturnType<typeof getStrings> }) {
  const items: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "home", label: s.tabHome, icon: <HomeIcon /> },
    { key: "debts", label: s.tabDebts, icon: <CardIcon /> },
    { key: "customers", label: s.tabCustomers, icon: <PeopleIcon /> },
    { key: "products", label: s.tabProducts, icon: <BoxIcon /> },
    { key: "templates", label: s.tabTemplates, icon: <DocIcon /> },
    { key: "sms", label: s.tabSms, icon: <ChatIcon /> },
    { key: "reports", label: s.tabReports, icon: <ChartIcon /> },
    { key: "settings", label: s.tabSettings, icon: <GearIcon /> },
  ];

  return (
    <nav
      className="tma-card fixed inset-x-0 bottom-0 z-30 border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="tma-no-scrollbar flex overflow-x-auto">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onTab(it.key)}
            className="flex min-w-[72px] flex-1 shrink-0 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition"
            style={{ color: tab === it.key ? "var(--tg-button)" : "var(--tg-hint)" }}
          >
            {it.icon}
            <span className="whitespace-nowrap">{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 11 12 4l9 7M5 10v9h14v-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 14.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.8M20.5 19a5.5 5.5 0 0 0-3.4-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M6 3h8l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3A8 8 0 1 1 21 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5 13.5 5h2.6l1.3 2.3 2.6.4-.4 2.6L21.5 12l-1.9 1.7.4 2.6-2.6.4L16.1 19h-2.6L12 21.5 10.5 19H7.9l-1.3-2.3-2.6-.4.4-2.6L2.5 12l1.9-1.7-.4-2.6 2.6-.4L7.9 5h2.6L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
