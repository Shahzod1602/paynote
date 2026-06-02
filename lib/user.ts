import "server-only";
import { prisma } from "./prisma";
import { getUserId } from "./session";

export async function getCurrentUser() {
  const userId = await getUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { businesses: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  return user;
}

/** Returns the user's primary business id, or null if not logged in. */
export async function getActiveBusinessId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.businesses[0]?.id ?? null;
}
