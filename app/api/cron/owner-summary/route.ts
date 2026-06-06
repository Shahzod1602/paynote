import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOwnerDailySummary, type SummaryStatus } from "@/lib/notify/owner";

export const dynamic = "force-dynamic";

/**
 * Daily owner digest. Call on a schedule (e.g. each morning) with:
 *   GET /api/cron/owner-summary   header: Authorization: Bearer <CRON_SECRET>
 *   or  /api/cron/owner-summary?secret=<CRON_SECRET>
 * DMs every business owner who linked Telegram a "who owes + total" summary.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businesses = await prisma.business.findMany({
    where: { user: { telegramUserId: { not: null } } },
    select: { id: true },
  });

  const tally: Record<SummaryStatus, number> = { sent: 0, skip: 0, mock: 0, fail: 0 };
  for (const b of businesses) {
    tally[await sendOwnerDailySummary(b.id)]++;
  }

  return NextResponse.json({
    ok: true,
    businesses: businesses.length,
    ...tally,
    ranAt: new Date().toISOString(),
  });
}
