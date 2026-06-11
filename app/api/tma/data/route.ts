import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import {
  getDashboardStats,
  getDebtsGrouped,
  getDebts,
  getCustomers,
  getApprovedTemplates,
  getTemplates,
  getProducts,
  getMessageLogs,
  getMonthlyReport,
} from "@/lib/queries";

// Cookie-scoped (getCurrentUser reads the session) → always dynamic.
export const dynamic = "force-dynamic";

/**
 * Mini App bundle: everything the tabs need in one round-trip —
 * stats + who-owes + customers + debts + products + templates + sms log +
 * monthly report + the owner's profile (header/profile card).
 */
export async function GET() {
  const user = await getCurrentUser();
  const business = user?.businesses[0];
  if (!user || !business) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const businessId = business.id;

  const [stats, debts, allDebts, customers, templates, templatesAll, products, messages, monthly] =
    await Promise.all([
      getDashboardStats(businessId),
      getDebtsGrouped(businessId),
      getDebts(businessId),
      getCustomers(businessId),
      getApprovedTemplates(businessId),
      getTemplates(businessId),
      getProducts(businessId),
      getMessageLogs(businessId, 50),
      getMonthlyReport(businessId, 6),
    ]);

  return NextResponse.json({
    stats,
    debts,
    allDebts,
    customers,
    templates,
    templatesAll,
    products,
    messages,
    monthly,
    me: {
      name: user.name,
      phone: user.phone,
      businessName: business.name,
      smsBalance: business.smsBalance,
    },
  });
}
