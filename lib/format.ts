export function formatUZS(amount: number): string {
  return "₸ " + new Intl.NumberFormat("ru-RU").format(Math.round(amount));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA").format(d); // YYYY-MM-DD
}
