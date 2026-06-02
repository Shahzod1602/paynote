import { PrismaClient, DebtStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PHONE = "+998901234567";
const DEMO_PASSWORD = "demo1234";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding demo data...");

  // Reset demo user (cascades to businesses, customers, debts, payments).
  await prisma.user.deleteMany({ where: { phone: DEMO_PHONE } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      name: "Akmal Karimov",
      phone: DEMO_PHONE,
      passwordHash,
      businesses: {
        create: { name: "Akmal Market", currency: "UZS" },
      },
    },
    include: { businesses: true },
  });
  const business = user.businesses[0];

  const customers: { name: string; phone: string; telegramChatId?: string }[] = [
    { name: "Dilnoza Yusupova", phone: "+998932221100" },
    { name: "Sherzod Toshmatov", phone: "+998998887766" },
    { name: "Madina Saidova", phone: "+998915554433" },
    { name: "Jasur Rahimov", phone: "+998901112233" },
    { name: "Nigora Qodirova", phone: "+998937778899" },
  ];

  const created = [];
  for (const c of customers) {
    created.push(
      await prisma.customer.create({
        data: {
          name: c.name,
          phone: c.phone,
          telegramChatId: c.telegramChatId ?? null,
          businessId: business.id,
        },
      })
    );
  }

  // Debts: a mix of pending, overdue and fully-paid.
  const debts = [
    { customer: 0, amount: 1250000, due: daysFromNow(10), status: DebtStatus.PENDING, note: "Maishiy texnika" },
    { customer: 1, amount: 3100000, due: daysFromNow(-11), status: DebtStatus.OVERDUE, note: "Muzlatgich (nasiya)" },
    { customer: 2, amount: 420000, due: daysFromNow(-16), status: DebtStatus.PAID, note: "Oziq-ovqat", paid: 420000 },
    { customer: 3, amount: 890000, due: daysFromNow(5), status: DebtStatus.PENDING, note: "Kiyim-kechak" },
    { customer: 4, amount: 640000, due: daysFromNow(2), status: DebtStatus.PENDING, note: "Telefon aksessuar" },
    { customer: 1, amount: 540000, due: daysFromNow(-3), status: DebtStatus.OVERDUE, note: "Qarz qoldig'i" },
  ];

  for (const d of debts) {
    await prisma.debt.create({
      data: {
        amount: d.amount,
        currency: "UZS",
        dueDate: d.due,
        note: d.note,
        status: d.status,
        customerId: created[d.customer].id,
        businessId: business.id,
        payments: d.paid ? { create: { amount: d.paid, paidAt: daysFromNow(-18) } } : undefined,
      },
    });
  }

  // One pre-approved SMS template so the reminder picker works out of the box.
  await prisma.messageTemplate.create({
    data: {
      type: "REMINDER",
      name: "Muloyim eslatma",
      bodyUz:
        "Hurmatli {{client_name}}, {{business_name}} do'konida {{debt_amount}} {{currency}} qarzingiz bor. Iltimos, {{days_to_deadline}} kun ichida to'lab qo'ying. Aloqa: {{business_phone}}",
      bodyRu:
        "Уважаемый(ая) {{client_name}}, у вас задолженность {{debt_amount}} {{currency}} в магазине {{business_name}}. Просьба оплатить в течение {{days_to_deadline}} дней. Контакт: {{business_phone}}",
      bodyEn:
        "Dear {{client_name}}, you owe {{debt_amount}} {{currency}} at {{business_name}}. Please pay within {{days_to_deadline}} days. Contact: {{business_phone}}",
      requiresDebt: true,
      smsEnabled: true,
      status: "APPROVED",
      businessId: business.id,
    },
  });

  console.log(`Done. Demo user: ${DEMO_PHONE} / ${DEMO_PASSWORD}`);
  console.log(`Business: ${business.name} (${created.length} customers, ${debts.length} debts)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
