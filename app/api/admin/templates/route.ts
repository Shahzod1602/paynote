import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Template moderation endpoint — simulates the SMS operator.
 * Protected by CRON_SECRET (same scheme as the cron route).
 *
 *   GET /api/admin/templates?secret=<CRON_SECRET>
 *       → approve ALL pending templates
 *   GET /api/admin/templates?secret=<CRON_SECRET>&id=<id>&status=REJECTED
 *       → set one template's status
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const statusParam = (request.nextUrl.searchParams.get("status") || "APPROVED").toUpperCase();
  if (statusParam !== "APPROVED" && statusParam !== "REJECTED" && statusParam !== "PENDING") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const status = statusParam as "APPROVED" | "REJECTED" | "PENDING";

  if (id) {
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.messageTemplate.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true, updated: 1, id, status });
  }

  const result = await prisma.messageTemplate.updateMany({
    where: { status: "PENDING" },
    data: { status },
  });
  return NextResponse.json({ ok: true, updated: result.count, status });
}
