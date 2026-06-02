import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  uz: () => import("@/dictionaries/uz.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["uz"]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = dictionaries[locale] ?? dictionaries.uz;
  return load();
}
