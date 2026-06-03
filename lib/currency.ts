import "server-only";
import { cookies } from "next/headers";
import type { Currency } from "./format";

/** Reads the display-currency preference from the CURRENCY cookie (defaults UZS). */
export async function getServerCurrency(): Promise<Currency> {
  const value = (await cookies()).get("CURRENCY")?.value;
  return value === "USD" ? "USD" : "UZS";
}
