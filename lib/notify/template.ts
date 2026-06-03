// Pure template helpers — client-safe (no server-only / prisma imports), so the
// editor preview can reuse renderTemplate with sample data.

/** Placeholders a business may use inside a template body. */
export const TEMPLATE_VARIABLES = [
  "client_name",
  "business_name",
  "client_balance",
  "debt_amount",
  "currency",
  "days_to_deadline",
  "days_passed",
  "business_phone",
] as const;

export type TemplateVarKey = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateVars = Record<TemplateVarKey, string>;

function num(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

/** Replaces {{var}} placeholders; unknown placeholders are left untouched. */
export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, key: string) =>
    key in vars ? vars[key as TemplateVarKey] : whole
  );
}

/** Builds the variable map from a debt/customer/business for a real send. */
export function buildTemplateVars(opts: {
  clientName: string;
  businessName: string;
  businessPhone: string;
  clientBalance: number;
  debtAmount: number;
  currency: string;
  dueDate: Date | null;
}): TemplateVars {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysToDeadline = "";
  let daysPassed = "";
  if (opts.dueDate) {
    const due = new Date(opts.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    daysToDeadline = String(Math.max(diff, 0));
    daysPassed = String(Math.max(-diff, 0));
  }

  return {
    client_name: opts.clientName,
    business_name: opts.businessName,
    client_balance: num(opts.clientBalance),
    debt_amount: num(opts.debtAmount),
    currency: opts.currency,
    days_to_deadline: daysToDeadline,
    days_passed: daysPassed,
    business_phone: opts.businessPhone,
  };
}

/** Sample values for the live preview in the template editor. */
export const SAMPLE_VARS: TemplateVars = {
  client_name: "Akmal Karimov",
  business_name: "Akmal Market",
  client_balance: "1 500 000",
  debt_amount: "500 000",
  currency: "UZS",
  days_to_deadline: "3",
  days_passed: "0",
  business_phone: "+998 90 123 45 67",
};

export type TemplatePreset = {
  key: string;
  type: "REMINDER" | "OVERDUE" | "PAYMENT";
  name: { uz: string; ru: string; en: string };
  requiresDebt: boolean;
  requiresDay: boolean;
  smsEnabled: boolean;
  bodyUz: string;
  bodyRu: string;
  bodyEn: string;
};

/** 3 ready-made templates — pick one to fill the editor, or write your own. */
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    key: "gentle",
    type: "REMINDER",
    name: { uz: "Muloyim eslatma", ru: "Мягкое напоминание", en: "Gentle reminder" },
    requiresDebt: true,
    requiresDay: false,
    smsEnabled: true,
    bodyUz:
      "Hurmatli {{client_name}}, {{business_name}} do'konida {{debt_amount}} {{currency}} qarzingiz bor. Iltimos, {{days_to_deadline}} kun ichida to'lab qo'ying. Rahmat!",
    bodyRu:
      "Уважаемый(ая) {{client_name}}, у вас задолженность {{debt_amount}} {{currency}} в {{business_name}}. Просьба оплатить в течение {{days_to_deadline}} дней. Спасибо!",
    bodyEn:
      "Dear {{client_name}}, you have a debt of {{debt_amount}} {{currency}} at {{business_name}}. Please pay within {{days_to_deadline}} days. Thank you!",
  },
  {
    key: "overdue",
    type: "OVERDUE",
    name: { uz: "Muddati o'tgan", ru: "Просроченный платёж", en: "Overdue notice" },
    requiresDebt: true,
    requiresDay: false,
    smsEnabled: true,
    bodyUz:
      "Hurmatli {{client_name}}, {{debt_amount}} {{currency}} qarzingiz muddati {{days_passed}} kun oldin o'tgan. Iltimos, imkon qadar tezroq to'lang. — {{business_name}}",
    bodyRu:
      "Уважаемый(ая) {{client_name}}, срок оплаты {{debt_amount}} {{currency}} истёк {{days_passed}} дней назад. Просьба погасить как можно скорее. — {{business_name}}",
    bodyEn:
      "Dear {{client_name}}, your debt of {{debt_amount}} {{currency}} is {{days_passed}} days overdue. Please pay as soon as possible. — {{business_name}}",
  },
  {
    key: "thanks",
    type: "PAYMENT",
    name: { uz: "To'lov uchun rahmat", ru: "Спасибо за оплату", en: "Payment received" },
    requiresDebt: true,
    requiresDay: false,
    smsEnabled: true,
    bodyUz:
      "Hurmatli {{client_name}}, to'lovingiz qabul qilindi. Qoldiq qarz: {{client_balance}} {{currency}}. Rahmat! — {{business_name}}",
    bodyRu:
      "Уважаемый(ая) {{client_name}}, ваш платёж получен. Остаток долга: {{client_balance}} {{currency}}. Спасибо! — {{business_name}}",
    bodyEn:
      "Dear {{client_name}}, your payment has been received. Remaining balance: {{client_balance}} {{currency}}. Thank you! — {{business_name}}",
  },
];
