export type TmaLocale = "uz" | "en" | "ru";

/** Telegram language_code → our locale (client-safe; mirrors lib/tma/verify). */
export function pickLocale(code?: string): TmaLocale {
  const c = code?.toLowerCase() ?? "";
  if (c.startsWith("ru")) return "ru";
  if (c.startsWith("en")) return "en";
  return "uz";
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
  tabDebts: "Qarzlar",
  tabProducts: "Mahsulotlar",
  tabTemplates: "Shablonlar",
  tabSms: "SMS",
  tabReports: "Hisobotlar",
  tabSettings: "Sozlamalar",

  // header / profile
  business: "Biznes",
  smsBalance: "SMS balans",
  logout: "Chiqish",

  // debts page
  filterAll: "Barchasi",

  // products
  addProduct: "Mahsulot qo‘shish",
  productName: "Nomi",
  price: "Narx",
  noProducts: "Mahsulot yo‘q",
  confirmDelete: "O‘chirilsinmi?",

  // templates
  addTemplate: "Shablon qo‘shish",
  templateName: "Nomi",
  templateText: "Matn",
  templateType: "Turi",
  typeReminder: "Eslatma",
  typeOverdue: "Muddati o‘tgan",
  typePayment: "To‘lov",
  typeCustom: "Boshqa",
  noTemplates: "Shablon yo‘q",
  moderationNote: "Yangi shablon operator tasdig‘idan so‘ng ishlatiladi.",
  tplPending: "Moderatsiyada",
  tplApproved: "Tasdiqlangan",
  tplRejected: "Rad etilgan",

  // sms page
  msgSent: "Yuborildi",
  msgFailed: "Xato",
  msgMock: "Sinov",

  // reports
  monthsShort: ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"],

  // settings
  language: "Til",
  langAuto: "Avtomatik (Telegram)",
  currencyLabel: "Valyuta",

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
  tabDebts: "Debts",
  tabProducts: "Products",
  tabTemplates: "Templates",
  tabSms: "SMS",
  tabReports: "Reports",
  tabSettings: "Settings",

  business: "Business",
  smsBalance: "SMS balance",
  logout: "Log out",

  filterAll: "All",

  addProduct: "Add product",
  productName: "Name",
  price: "Price",
  noProducts: "No products",
  confirmDelete: "Delete?",

  addTemplate: "Add template",
  templateName: "Name",
  templateText: "Text",
  templateType: "Type",
  typeReminder: "Reminder",
  typeOverdue: "Overdue",
  typePayment: "Payment",
  typeCustom: "Custom",
  noTemplates: "No templates",
  moderationNote: "New templates go live after operator approval.",
  tplPending: "In review",
  tplApproved: "Approved",
  tplRejected: "Rejected",

  msgSent: "Sent",
  msgFailed: "Failed",
  msgMock: "Test",

  monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

  language: "Language",
  langAuto: "Automatic (Telegram)",
  currencyLabel: "Currency",

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

const ru: TmaStrings = {
  openInTelegram: "Откройте это приложение через Telegram.",
  connecting: "Подключение…",
  linkTitle: "Привязка аккаунта",
  linkSubtitle: "Привяжите Telegram к аккаунту Paynote — затем вход будет автоматическим.",
  sharePhone: "Поделиться номером телефона",
  orPassword: "или по телефону и паролю",
  phone: "Телефон",
  password: "Пароль",
  login: "Войти",
  linking: "Привязка…",
  contactNoPhone: "Не удалось получить номер. Войдите по телефону и паролю.",
  errPhoneNoMatch: "Этот номер не найден на платформе. Войдите по телефону и паролю.",
  errInvalidCreds: "Неверный телефон или пароль.",
  errTgLinked: "Этот Telegram уже привязан к другому аккаунту.",
  errAccountLinked: "Этот аккаунт привязан к другому Telegram.",
  errInvalidInit: "Ошибка проверки сессии. Откройте приложение заново.",
  errGeneric: "Произошла ошибка. Попробуйте ещё раз.",

  hello: "Привет",
  totalOutstanding: "Всего долг",
  customersCount: "Клиенты",
  overdue: "Просрочено",
  collectedThisMonth: "Собрано за месяц",
  whoOwes: "Кто должен",
  noDebts: "Пока долгов нет",
  search: "Поиск…",
  addDebt: "Добавить долг",
  tabHome: "Главная",
  tabCustomers: "Клиенты",
  tabDebts: "Долги",
  tabProducts: "Товары",
  tabTemplates: "Шаблоны",
  tabSms: "SMS",
  tabReports: "Отчёты",
  tabSettings: "Настройки",

  business: "Бизнес",
  smsBalance: "Баланс SMS",
  logout: "Выйти",

  filterAll: "Все",

  addProduct: "Добавить товар",
  productName: "Название",
  price: "Цена",
  noProducts: "Нет товаров",
  confirmDelete: "Удалить?",

  addTemplate: "Добавить шаблон",
  templateName: "Название",
  templateText: "Текст",
  templateType: "Тип",
  typeReminder: "Напоминание",
  typeOverdue: "Просрочка",
  typePayment: "Оплата",
  typeCustom: "Другое",
  noTemplates: "Нет шаблонов",
  moderationNote: "Новый шаблон станет активным после одобрения оператора.",
  tplPending: "На модерации",
  tplApproved: "Одобрено",
  tplRejected: "Отклонено",

  msgSent: "Отправлено",
  msgFailed: "Ошибка",
  msgMock: "Тест",

  monthsShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],

  language: "Язык",
  langAuto: "Автоматически (Telegram)",
  currencyLabel: "Валюта",

  customersTitle: "Клиенты",
  noCustomers: "Нет клиентов",
  debtCountSuffix: "долгов",
  noPhoneShort: "нет телефона",

  balance: "Баланс",
  borrowed: "Взято",
  paid: "Оплачено",
  debtsTitle: "Долги",
  messagesTitle: "Сообщения",
  noMessages: "Нет сообщений",
  overpaidCredit: "переплата",

  statusPaid: "Оплачено",
  statusPending: "Ожидает",
  statusOverdue: "Просрочено",

  amount: "Сумма",
  dueDate: "Срок",
  note: "Примечание",
  customer: "Клиент",
  selectCustomer: "Выберите клиента",
  save: "Сохранить",
  saving: "Сохранение…",
  cancel: "Отмена",
  errorSave: "Ошибка сохранения",

  newDebt: "Новый долг",

  payment: "Оплата",
  paymentAmount: "Сумма оплаты",

  reminder: "Напоминание",
  reminderTitle: "Отправить напоминание",
  channel: "Канал",
  channelAuto: "Автоматически",
  channelTelegram: "Telegram",
  channelSms: "SMS",
  template: "Шаблон",
  templateDefault: "Стандартный текст",
  send: "Отправить",
  sending: "Отправка…",
  sent: "Отправлено",
  mockSent: "Отправлено (тестовый режим)",
  failed: "Не отправлено",
  noPhone: "У клиента нет телефона",
  noTelegram: "У клиента нет Telegram",
  noSmsBalance: "Баланс SMS закончился",
  rateLimited: "Слишком много SMS. Попробуйте позже.",
  templateUnavailable: "Шаблон недоступен",
};

export const STRINGS: Record<TmaLocale, TmaStrings> = { uz, en, ru };

export function getStrings(locale: TmaLocale): TmaStrings {
  return STRINGS[locale];
}
