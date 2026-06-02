# pDaftar (klon)

Qarz daftari va nasiya savdosi ilovasining kloni — [pdaftar.uz](https://pdaftar.uz) asosida.
**Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4** + **Prisma** + **PostgreSQL**. UZ/EN ikki tilli.

## Talablar

- Node 18+
- Local PostgreSQL (loyiha `postgresql://shahzod@localhost:5432/pdaftar` ga ulanadi — `.env` da o'zgartiring)

## Ishga tushirish

```bash
npm install
npm run db:migrate     # jadvallarni yaratish (prisma migrate dev)
npm run db:seed        # demo ma'lumot + demo user
npm run dev            # http://localhost:3000  (→ /uz ga yo'naltiradi)
```

Boshqa skriptlar: `npm run build`, `npm run start`, `npm run db:studio` (Prisma Studio).

## 🔑 Demo hisob

| Telefon | Parol |
|---------|-------|
| `+998 90 123 45 67` | `demo1234` |

Login sahifasidagi **"Demo hisob bilan kirish"** tugmasi orqali bir bosishda kiring.

## Struktura

```
app/[locale]/              # uz / en
  page.tsx                 # landing
  login/ register/         # auth (real, server actions)
  dashboard/               # himoyalangan panel
    page.tsx               # overview (real statistika)
    customers/ debts/      # CRUD
components/
  landing/  auth/  dashboard/  ui/
lib/
  prisma.ts                # Prisma client singleton
  session.ts               # JWT sessiya (jose, httpOnly cookie)
  user.ts                  # joriy foydalanuvchi / aktiv biznes
  queries.ts               # o'qish so'rovlari (stats, customers, debts)
  format.ts                # pul/sana formati
  actions/                 # server actions: auth, customers, debts
prisma/
  schema.prisma            # User, Business, Customer, Debt, Payment
  seed.ts                  # demo ma'lumot
proxy.ts                   # til yo'naltirish + /dashboard himoyasi
dictionaries/              # uz.json, en.json
```

## Autentifikatsiya

- Parol **bcrypt** bilan hash qilinadi
- Sessiya — **JWT** (`jose`), `httpOnly` cookie (`pdaftar_session`), 30 kun
- `proxy.ts` `/dashboard` ga cookie'siz kirishni login'ga yo'naltiradi
- Server actions: `lib/actions/auth.ts` (register / login / logout)

## Ma'lumotlar modeli

`User` → `Business` (1:N) → `Customer` (1:N) → `Debt` (1:N) → `Payment` (1:N).
Qarz holati (PENDING / OVERDUE / PAID) qoldiq va muddatdan avtomatik hisoblanadi.

## Supabase'ga ko'chirish (keyin)

Sxema PostgreSQL-mos. Supabase'ga o'tish uchun `.env` dagi `DATABASE_URL` ni Supabase connection string'iga almashtiring va `npm run db:migrate` ni qayta ishga tushiring.

## Eslatmalar (SMS + Telegram)

Provayderdan mustaqil. Kalitlar `.env` da bo'sh bo'lsa **MOCK rejim** — yuborilmaydi, konsolga yoziladi va `MessageLog` ga `MOCK` holati bilan saqlanadi.

- `lib/notify/telegram.ts` — Telegram Bot API (bepul)
- `lib/notify/sms.ts` — sms.identify.uz (boshqa shlyuzga almashtirish oson)
- `lib/notify/index.ts` — matn yasash + kanal tanlash (AUTO: Telegram bo'lsa Telegram, bo'lmasa SMS)

**Qo'lda:** Qarzlar sahifasida har qarz yonida **"Eslatma"** tugmasi → kanal tanlab yuboriladi.

**SMS balansi (bepul kvota):** Har bir biznes ro'yxatdan o'tganda **50 ta bepul SMS** oladi (`Business.smsBalance`). Har muvaffaqiyatli SMS −1 (Telegram bepul, balansga ta'sir qilmaydi); yuborilmasa balans qaytariladi. Balans tugasa yuborish to'xtaydi. Suiiste'molga qarshi: bir biznes soatiga maksimal **30 SMS**. Biznes o'z tarixi va qolgan balansini **Dashboard → SMS** (`/dashboard/messages`) sahifasida ko'radi.

**SMS shablonlari (`/dashboard/templates`):** Bizneslar o'zgaruvchili qayta ishlatiladigan xabar shablonlarini yaratadi (UZ/RU/EN), telefon preview bilan. O'zgaruvchilar: `{{client_name}}`, `{{business_name}}`, `{{client_balance}}`, `{{debt_amount}}`, `{{currency}}`, `{{days_to_deadline}}`, `{{days_passed}}`, `{{business_phone}}` (`lib/notify/template.ts`). Eslatma yuborishda shablon tanlanadi; tanlanmasa built-in matn ishlatiladi.

**Moderatsiya:** Yangi/tahrirlangan shablon `PENDING` holatga tushadi; faqat `APPROVED` shablon yuboriladi. Operatorni taqlid qilish (CRON_SECRET himoyasi):
```bash
curl "http://localhost:3000/api/admin/templates?secret=$CRON_SECRET"            # barcha PENDING → APPROVED
curl "http://localhost:3000/api/admin/templates?secret=$CRON_SECRET&id=<id>&status=REJECTED"
```
Seed'da 1 ta tayyor `APPROVED` shablon bor ("Muloyim eslatma").

**Avtomatik (cron):**
```bash
curl "http://localhost:3000/api/cron/reminders?secret=$CRON_SECRET"
# yoki: Authorization: Bearer <CRON_SECRET>
```
Muddati o'tgan yoki 3 kun ichida muddati keladigan to'lanmagan qarzlarga AUTO yuboradi.
Productionda kunlik cron (Vercel Cron / system cron) bilan chaqiring.

**Real yuborishni yoqish:** `.env` da to'ldiring:
- Telegram: `TELEGRAM_BOT_TOKEN` (@BotFather dan). Mijoz avval botga `/start` bosib, uning `chat_id` si mijoz kartochkasiga kiritiladi.
- SMS: `IDENTIFY_SMS_API_KEY` (sms.identify.uz dashboard → API keys, `sk_live_...`). Ixtiyoriy: `IDENTIFY_SMS_SIM` (1 yoki 2).

## Deploy (Docker + GitHub Actions CI/CD)

App + PostgreSQL Docker Compose orqali ishlaydi. `main`'ga push qilinganda GitHub Actions serverga SSH orqali deploy qiladi (`.github/workflows/deploy.yml`).

**Server (bir martalik sozlash):**
```bash
git clone https://github.com/Shahzod1602/paynote.git /opt/paynote
cd /opt/paynote
cp .env.example .env   # va to'ldiring (POSTGRES_PASSWORD, AUTH_SECRET, CRON_SECRET, IDENTIFY_SMS_API_KEY ...)
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed   # demo hisob + namuna shablon (ixtiyoriy)
```
App `http://<server-ip>:3008` da ochiladi (host 3008 → konteyner 3000).

**GitHub secrets** (Settings → Secrets → Actions): `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (server `authorized_keys`'ga mos deploy kaliti).

Migratsiyalar konteyner har ishga tushganda avtomatik qo'llanadi (`prisma migrate deploy`).

## Keyingi qadamlar

- Telegram webhook — mijoz `/start` bosganda `chat_id` ni avtomatik bog'lash
- Hisobotlar va eksport (Excel/PDF), grafiklar
- Ko'p sotuvchi / ko'p do'kon boshqaruvi
- Reverse proxy + domen + HTTPS (nginx/traefik)
