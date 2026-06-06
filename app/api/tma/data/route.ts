import { NextResponse } from "next/server";
import { getActiveBusinessId } from "@/lib/user";
import {
  getDashboardStats,
  getDebtsGrouped,
  getCustomers,
  getApprovedTemplates,
} from "@/lib/queries";

// Cookie-scoped (getActiveBusinessId reads the session) → always dynamic.
export const dynamic = "force-dynamic";

/** Mini App home bundle: stats + who-owes + customers (for add-debt) + templates. */
export async function GET() {
  const businessId = await getActiveBusinessId();
  if (!businessId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const [stats, debts, customers, templates] = await Promise.all([
    getDashboardStats(businessId),
    getDebtsGrouped(businessId),
    getCustomers(businessId),
    getApprovedTemplates(businessId),
  ]);

  return NextResponse.json({ stats, debts, customers, templates });
}
