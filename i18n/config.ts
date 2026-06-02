export const locales = ["uz", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "uz";

export const localeNames: Record<Locale, string> = {
  uz: "O'zbekcha",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
