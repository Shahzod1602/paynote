export type Currency = "UZS" | "USD";

/** 1 USD = N UZS (display-only conversion; override via env on the server). */
export const USD_RATE = 12600;

export function formatUZS(amount: number): string {
  return "₸ " + new Intl.NumberFormat("ru-RU").format(Math.round(amount));
}

/** Formats a UZS amount in the chosen display currency. */
export function formatMoney(amountUzs: number, currency: Currency = "UZS"): string {
  if (currency === "USD") {
    const usd = amountUzs / USD_RATE;
    return "$ " + new Intl.NumberFormat("en-US", { maximumFractionDigits: usd < 100 ? 2 : 0 }).format(usd);
  }
  return formatUZS(amountUzs);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA").format(d); // YYYY-MM-DD
}
