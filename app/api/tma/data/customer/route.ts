import { NextRequest, NextResponse } from "next/server";
import { getActiveBusinessId } from "@/lib/user";
import { getCustomerProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Full profile for one customer (debts + message history). */
export async function GET(req: NextRequest) {
  const businessId = await getActiveBusinessId();
  if (!businessId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const profile = await getCustomerProfile(businessId, id);
  if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ profile });
}
