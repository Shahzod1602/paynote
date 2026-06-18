"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { formatMoney, type Currency } from "@/lib/format";
import type { TmaLocale } from "./strings";

/** "auto" follows the Telegram client's language_code. */
export type LocalePref = "auto" | TmaLocale;

const CURRENCY_KEY = "tma_currency";
const LOCALE_KEY = "tma_locale";

type Prefs = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  localePref: LocalePref;
  setLocalePref: (l: LocalePref) => void;
  /** Formats a UZS amount in the chosen display currency. */
  fmt: (amountUzs: number) => string;
};

const Ctx = createContext<Prefs | null>(null);

export function usePrefs(): Prefs {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used within <PrefsProvider>");
  return ctx;
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("UZS");
  const [localePref, setLocalePrefState] = useState<LocalePref>("auto");

  // Hydrate persisted choices once on mount (localStorage is client-only).
  useEffect(() => {
    try {
      const c = localStorage.getItem(CURRENCY_KEY);
      const l = localStorage.getItem(LOCALE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (c === "UZS" || c === "USD") setCurrencyState(c);
      if (l === "auto" || l === "uz" || l === "en" || l === "ru") setLocalePrefState(l);
    } catch {
      /* storage unavailable — keep defaults */
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {}
  }, []);

  const setLocalePref = useCallback((l: LocalePref) => {
    setLocalePrefState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {}
  }, []);

  const fmt = useCallback((amountUzs: number) => formatMoney(amountUzs, currency), [currency]);

  return (
    <Ctx.Provider value={{ currency, setCurrency, localePref, setLocalePref, fmt }}>
      {children}
    </Ctx.Provider>
  );
}
