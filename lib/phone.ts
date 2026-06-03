// Pure phone helpers (client-safe). Uzbek mobile numbers: +998 + 9 national digits.

/**
 * Normalizes user input to E.164 (+998XXXXXXXXX), or null if it isn't a valid
 * Uzbek mobile number. Accepts "901234567", "998901234567", "+998 90 123 45 67".
 */
export function normalizePhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  let national: string;
  if (digits.length === 9) national = digits;
  else if (digits.length === 12 && digits.startsWith("998")) national = digits.slice(3);
  else return null;
  // National part must be 9 digits and start with a valid operator code (9X / 8X / 7X / 33 / 20…).
  if (!/^\d{9}$/.test(national)) return null;
  return "+998" + national;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** Pretty display: +998 90 123 45 67 */
export function formatPhone(input: string): string {
  const e164 = normalizePhone(input);
  if (!e164) return input;
  const n = e164.slice(4); // 9 digits
  return `+998 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}
