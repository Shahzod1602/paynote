"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export type AdminActionState = { error?: string; success?: boolean };

async function requireSuperadmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }
  return me;
}

const adjustBalanceSchema = z.object({
  businessId: z.string().min(1),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  note: z.string().trim().optional(),
});

export async function adjustBalanceAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const me = await requireSuperadmin();

  const parsed = adjustBalanceSchema.safeParse({
    businessId: formData.get("businessId"),
    amount: Number(formData.get("amount")),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const { businessId, amount, note } = parsed.data;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { error: "BUSINESS_NOT_FOUND" };

  const newBalance = business.smsBalance + amount;
  if (newBalance < 0) return { error: "INSUFFICIENT_BALANCE" };

  await prisma.$transaction([
    prisma.business.update({
      where: { id: businessId },
      data: { smsBalance: newBalance },
    }),
    prisma.balanceLog.create({
      data: {
        amount,
        note,
        businessId,
        adminId: me.id,
      },
    }),
  ]);

  revalidatePath("/[locale]/admin", "page");
  revalidatePath(`/[locale]/admin/${business.userId}`, "page");
  return { success: true };
}

export async function toggleBlockUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSuperadmin();

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return { error: "INVALID_INPUT" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "USER_NOT_FOUND" };
  if (user.role === "SUPERADMIN") return { error: "CANNOT_BLOCK_SUPERADMIN" };

  await prisma.user.update({
    where: { id: userId },
    data: { blocked: !user.blocked },
  });

  revalidatePath("/[locale]/admin", "page");
  revalidatePath(`/[locale]/admin/${userId}`, "page");
  return { success: true };
}
