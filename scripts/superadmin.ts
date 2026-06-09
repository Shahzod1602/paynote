// Telefon raqami bo'yicha foydalanuvchini SUPERADMIN qiladi (yoki USER ga qaytaradi).
// Ishlatish:
//   npm run superadmin -- +998901234567
//   npm run superadmin -- +998901234567 --revoke
import { PrismaClient, UserRole } from "@prisma/client";
import { normalizePhone } from "../lib/phone";

const prisma = new PrismaClient();

async function main() {
  const [rawPhone, flag] = process.argv.slice(2);
  if (!rawPhone) {
    console.error("Ishlatish: npm run superadmin -- <telefon> [--revoke]");
    process.exit(1);
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    console.error(`Telefon raqami noto'g'ri: ${rawPhone}`);
    process.exit(1);
  }

  const role = flag === "--revoke" ? UserRole.USER : UserRole.SUPERADMIN;
  const user = await prisma.user.update({ where: { phone }, data: { role } }).catch(() => null);
  if (!user) {
    console.error(`Foydalanuvchi topilmadi: ${phone}`);
    process.exit(1);
  }

  console.log(`✓ ${user.name} (${user.phone}) endi: ${user.role}`);
}

main().finally(() => prisma.$disconnect());
