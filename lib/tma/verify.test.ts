// Standalone test (no test runner needed): `npx tsx lib/tma/verify.test.ts`
import { createHmac } from "node:crypto";
import { verifyInitData, localeFromLanguageCode } from "./verify";

const TOKEN = "123456:TEST_FAKE_BOT_TOKEN";

/** Forges a valid `initData` query-string for the given fields + token. */
function sign(fields: Record<string, string>, token: string): string {
  const dcs = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(dcs).digest("hex");
  const p = new URLSearchParams(fields);
  p.set("hash", hash);
  return p.toString();
}

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    failures++;
  }
}

const now = 1_900_000_000; // fixed "now" for deterministic freshness tests
const user = JSON.stringify({ id: 777000, first_name: "Akmal", username: "akmal", language_code: "uz" });

// 1) Valid initData
{
  const initData = sign({ user, auth_date: String(now - 10), query_id: "AAH" }, TOKEN);
  const r = verifyInitData(initData, { botToken: TOKEN, now });
  check("valid initData → ok", r.ok === true);
  check("valid → user.id parsed", r.ok && r.user.id === 777000);
}

// 2) Tampered hash → BAD_HASH
{
  const initData = sign({ user, auth_date: String(now - 10) }, TOKEN);
  const tampered = initData.replace(/hash=[0-9a-f]+/, (m) => "hash=" + "0".repeat(m.length - 5));
  const r = verifyInitData(tampered, { botToken: TOKEN, now });
  check("tampered hash → rejected", r.ok === false);
  check("tampered hash → reason BAD_HASH", !r.ok && r.reason === "BAD_HASH");
}

// 3) Wrong token → BAD_HASH
{
  const initData = sign({ user, auth_date: String(now - 10) }, TOKEN);
  const r = verifyInitData(initData, { botToken: "999:OTHER", now });
  check("wrong bot token → rejected", r.ok === false);
}

// 4) Stale auth_date (2h old, max 1h) → STALE
{
  const initData = sign({ user, auth_date: String(now - 7200) }, TOKEN);
  const r = verifyInitData(initData, { botToken: TOKEN, now });
  check("stale auth_date → rejected", r.ok === false);
  check("stale → reason STALE", !r.ok && r.reason === "STALE");
}

// 5) Missing hash → NO_HASH
{
  const r = verifyInitData("user=" + encodeURIComponent(user) + "&auth_date=" + (now - 10), { botToken: TOKEN, now });
  check("missing hash → NO_HASH", !r.ok && r.reason === "NO_HASH");
}

// 6) Missing user → NO_USER
{
  const initData = sign({ auth_date: String(now - 10), query_id: "AAH" }, TOKEN);
  const r = verifyInitData(initData, { botToken: TOKEN, now });
  check("missing user → NO_USER", !r.ok && r.reason === "NO_USER");
}

// 7) No token configured → NO_TOKEN
{
  const initData = sign({ user, auth_date: String(now - 10) }, TOKEN);
  const r = verifyInitData(initData, { botToken: "", now });
  check("no bot token → NO_TOKEN", !r.ok && r.reason === "NO_TOKEN");
}

// 8) locale mapping
{
  check("language_code en → en", localeFromLanguageCode("en-US") === "en");
  check("language_code uz → uz", localeFromLanguageCode("uz") === "uz");
  check("language_code ru → uz", localeFromLanguageCode("ru") === "uz");
  check("language_code undefined → uz", localeFromLanguageCode(undefined) === "uz");
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll verifyInitData tests passed.");
