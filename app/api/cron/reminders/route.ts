import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/lib/notify";

// Days ahead to remind before the due date.
const REMIND_WINDOW_DAYS = 3;
const MAX_PER_RUN = 200;

/**
 * Automatic reminders. Call on a schedule (e.g. daily) with:
 *   GET /api/cron/reminders   header: Authorization: Bearer <CRON_SECRET>
 *   or  /api/cron/reminders?secret=<CRON_SECRET>
 * Sends an AUTO-channel reminder for every unpaid debt that is overdue or due soon.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + REMIND_WINDOW_DAYS);

  // Unpaid debts with a due date within the window (or already past it).
  const debts = await prisma.debt.findMany({
    where: {
      status: { not: "PAID" },
      dueDate: { not: null, lte: cutoff },
    },
    include: { payments: true },
    orderBy: { dueDate: "asc" },
    take: MAX_PER_RUN,
  });

  let sent = 0;
  let mock = 0;
  let failed = 0;
  let skipped = 0;

  for (const debt of debts) {
    const paid = debt.payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number(debt.amount) - paid;
    if (balance <= 0) {
      skipped++;
      continue;
    }

    const outcome = await sendReminder({
      businessId: debt.businessId,
      debtId: debt.id,
      channel: "AUTO",
      locale: "uz",
    });

    if (!outcome.ok) failed++;
    else if (outcome.status === "SENT") sent++;
    else if (outcome.status === "MOCK") mock++;
    else failed++;
  }

  return NextResponse.json({
    ok: true,
    processed: debts.length,
    sent,
    mock,
    failed,
    skipped,
    ranAt: new Date().toISOString(),
  });
}
