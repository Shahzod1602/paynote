export type TmaLocale = "uz" | "en";

/** Telegram language_code → our locale (client-safe; mirrors lib/tma/verify). */
export function pickLocale(code?: string): TmaLocale {
  return code?.toLowerCase().startsWith("en") ? "en" : "uz";
}

const uz = {
  // auth
  openInTelegram: "Bu ilovani Telegram orqali oching.",
  connecting: "Ulanmoqda…",
  linkTitle: "Hisobingizga ulanish",
  linkSubtitle: "Telegram’ni Paynote hisobingizga bog‘lang — keyin avtomatik kirasiz.",
  sharePhone: "Telefon raqamni ulashish",
  orPassword: "yoki telefon va parol bilan",
  phone: "Telefon",
  password: "Parol",
  login: "Kirish",
  linking: "Bog‘lanmoqda…",
  contactNoPhone: "Raqam olinmadi. Telefon va parol bilan kiring.",
  errPhoneNoMatch: "Bu raqam platformada topilmadi. Telefon va parol bilan kiring.",
  errInvalidCreds: "Telefon yoki parol noto‘g‘ri.",
  errTgLinked: "Bu Telegram allaqachon boshqa akkauntga ulangan.",
  errAccountLinked: "Bu akkaunt boshqa Telegram’ga ulangan.",
  errInvalidInit: "Sessiya tekshiruvi xato. Ilovani qayta oching.",
  errGeneric: "Xatolik yuz berdi. Qayta urinib ko‘ring.",

  // home
  hello: "Salom",
  totalOutstanding: "Jami qarz",
  customersCount: "Mijozlar",
  overdue: "Muddati o‘tgan",
  collectedThisMonth: "Bu oy yig‘ildi",
  whoOwes: "Kim qarzdor",
  noDebts: "Hozircha qarz yo‘q",
  search: "Qidirish…",
  addDebt: "Qarz qo‘shish",
  tabHome: "Asosiy",
  tabCustomers: "Mijozlar",

  // customers
  customersTitle: "Mijozlar",
  noCustomers: "Mijoz yo‘q",
  debtCountSuffix: "ta qarz",
  noPhoneShort: "telefon yo‘q",

  // customer detail
  balance: "Balans",
  borrowed: "Olingan",
  paid: "To‘langan",
  debtsTitle: "Qarzlar",
  messagesTitle: "Xabarlar",
  noMessages: "Xabarlar yo‘q",
  overpaidCredit: "ortiqcha",

  // statuses
  statusPaid: "To‘langan",
  statusPending: "Kutilmoqda",
  statusOverdue: "Muddati o‘tgan",

  // sheets — common
  amount: "Summa",
  dueDate: "Muddat",
  note: "Izoh",
  customer: "Mijoz",
  selectCustomer: "Mijozni tanlang",
  save: "Saqlash",
  saving: "Saqlanmoqda…",
  cancel: "Bekor qilish",
  errorSave: "Saqlashda xato",

  // debt
  newDebt: "Yangi qarz",

  // payment
  payment: "To‘lov",
  paymentAmount: "To‘lov summasi",

  // reminder
  reminder: "Eslatma",
  reminderTitle: "Eslatma yuborish",
  channel: "Kanal",
  channelAuto: "Avtomatik",
  channelTelegram: "Telegram",
  channelSms: "SMS",
  template: "Shablon",
  templateDefault: "Standart matn",
  send: "Yuborish",
  sending: "Yuborilmoqda…",
  sent: "Yuborildi",
  mockSent: "Yuborildi (sinov rejimi)",
  failed: "Yuborilmadi",
  noPhone: "Mijozda telefon yo‘q",
  noTelegram: "Mijozda Telegram yo‘q",
  noSmsBalance: "SMS balans tugagan",
  rateLimited: "Juda ko‘p SMS. Birozdan keyin urinib ko‘ring.",
  templateUnavailable: "Shablon mavjud emas",
};

export type TmaStrings = typeof uz;

const en: TmaStrings = {
  openInTelegram: "Please open this app from Telegram.",
  connecting: "Connecting…",
  linkTitle: "Link your account",
  linkSubtitle: "Connect Telegram to your Paynote account — then you’re signed in automatically.",
  sharePhone: "Share phone number",
  orPassword: "or use phone & password",
  phone: "Phone",
  password: "Password",
  login: "Sign in",
  linking: "Linking…",
  contactNoPhone: "Couldn’t read the number. Sign in with phone & password.",
  errPhoneNoMatch: "This number isn’t registered. Sign in with phone & password.",
  errInvalidCreds: "Wrong phone or password.",
  errTgLinked: "This Telegram is already linked to another account.",
  errAccountLinked: "This account is linked to a different Telegram.",
  errInvalidInit: "Session check failed. Re-open the app.",
  errGeneric: "Something went wrong. Please try again.",

  hello: "Hello",
  totalOutstanding: "Total debt",
  customersCount: "Customers",
  overdue: "Overdue",
  collectedThisMonth: "Collected this month",
  whoOwes: "Who owes",
  noDebts: "No debts yet",
  search: "Search…",
  addDebt: "Add debt",
  tabHome: "Home",
  tabCustomers: "Customers",

  customersTitle: "Customers",
  noCustomers: "No customers",
  debtCountSuffix: "debts",
  noPhoneShort: "no phone",

  balance: "Balance",
  borrowed: "Borrowed",
  paid: "Paid",
  debtsTitle: "Debts",
  messagesTitle: "Messages",
  noMessages: "No messages",
  overpaidCredit: "credit",

  statusPaid: "Paid",
  statusPending: "Pending",
  statusOverdue: "Overdue",

  amount: "Amount",
  dueDate: "Due date",
  note: "Note",
  customer: "Customer",
  selectCustomer: "Select a customer",
  save: "Save",
  saving: "Saving…",
  cancel: "Cancel",
  errorSave: "Save failed",

  newDebt: "New debt",

  payment: "Payment",
  paymentAmount: "Payment amount",

  reminder: "Reminder",
  reminderTitle: "Send a reminder",
  channel: "Channel",
  channelAuto: "Automatic",
  channelTelegram: "Telegram",
  channelSms: "SMS",
  template: "Template",
  templateDefault: "Default text",
  send: "Send",
  sending: "Sending…",
  sent: "Sent",
  mockSent: "Sent (test mode)",
  failed: "Failed",
  noPhone: "Customer has no phone",
  noTelegram: "Customer has no Telegram",
  noSmsBalance: "SMS balance is empty",
  rateLimited: "Too many SMS. Try again later.",
  templateUnavailable: "Template unavailable",
};

export const STRINGS: Record<TmaLocale, TmaStrings> = { uz, en };

export function getStrings(locale: TmaLocale): TmaStrings {
  return STRINGS[locale];
}
