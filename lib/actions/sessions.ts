"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/user";
import { revokeSession } from "@/lib/rate-limit";

export type SessionActionState = { error?: string; success?: boolean };

export async function revokeSessionAction(
  _prev: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const me = await getCurrentUser();
  if (!me) return { error: "UNAUTHORIZED" };

  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId) return { error: "INVALID_INPUT" };

  await revokeSession(sessionId, me.id);
  revalidatePath("/[locale]/dashboard/settings", "page");
  return { success: true };
}
