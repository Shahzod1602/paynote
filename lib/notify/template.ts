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
