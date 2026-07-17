# Environment Variables

Copy `.env.local.example` → `.env.local` แล้วกรอกค่าต่อไปนี้

## Notion CMS

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `NOTION_API_KEY` | ✅ | Internal Integration Secret จาก notion.so/my-integrations |
| `NOTION_CARS_DB_ID` | ✅ | Database ID ของ Cars database |
| `NOTION_BLOG_DB_ID` | ✅ | Database ID ของ Blog database |
| `NOTION_STORIES_DB_ID` | ✅ | Database ID ของ Stories database |
| `NOTION_APPOINTMENTS_DB_ID` | ✅ | Database ID ของ Appointments database |
| `NOTION_CONTACTS_DB_ID` | ✅ | Database ID ของ Contacts database |
| `NOTION_PROMOTIONS_DB_ID` | optional | Database ID ของ Promotions database (brand web โปรโมชั่น) |
| `NOTION_SETTINGS_DB_ID` | optional | Database ID ของ Settings database (key-value config เช่น notify emails) |

**วิธีหา Database ID:** เปิด database ใน Notion → Copy link → URL มีรูปแบบ:
```
https://www.notion.so/workspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...
                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                นี่คือ Database ID (32 ตัวอักษร)
```

## Better Auth + Turso

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `BETTER_AUTH_SECRET` | ✅ | Random secret สำหรับ sign sessions (generate: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | ✅ prod | URL ของเว็บ เช่น `https://www.ch-erawan.com` (ใช้ `http://localhost:3002` ใน dev — port 3002 แยกจากแอปอื่นที่ใช้ 3000) |
| `TURSO_DATABASE_URL` | ✅ | รูปแบบ: `libsql://[db-name].aws-[region].turso.io` |
| `TURSO_AUTH_TOKEN` | ✅ | Auth token จาก Turso dashboard |

**สร้าง Turso DB:**
```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login

# Create database
turso db create ch-erawan

# Get URL
turso db show ch-erawan

# Create token
turso db tokens create ch-erawan
```

## Cloudinary

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | Cloud name (public — ใช้ใน client) |
| `CLOUDINARY_API_KEY` | ✅ | API Key (server-side only) |
| `CLOUDINARY_API_SECRET` | ✅ | API Secret (server-side only) |

สร้างได้ที่ https://cloudinary.com → Settings → Access Keys

> ⚠️ ปัจจุบัน upload widget ยังไม่ถูก implement — รูปอัปโหลดผ่าน Cloudinary dashboard แล้ว paste URL ลง Notion

## Google Maps

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ | Maps JavaScript API key (public — ใช้ใน client) |

**ขั้นตอน:**
1. ไป https://console.cloud.google.com
2. สร้าง project หรือเลือก project ที่มี
3. Enable **Maps JavaScript API**
4. สร้าง API Key → จำกัด HTTP referrers ให้เป็น domain ของเว็บ

## Email Notifications (Appointments)

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `APPOINTMENT_NOTIFY_EMAIL` | แนะนำ prod | อีเมล fallback ถ้าแบรนด์ไม่มี email ใน Notion |
| `RESEND_API_KEY` | optional | ใช้ Resend ส่งอีเมล (แนะนำ prod) |
| `RESEND_FROM_EMAIL` | optional | From address ที่ verify แล้วใน Resend |
| `SMTP_HOST` | optional | SMTP fallback ถ้าไม่มี Resend |
| `SMTP_PORT` | optional | default `587` |
| `SMTP_USER` | optional | SMTP username |
| `SMTP_PASS` | optional | SMTP password |
| `SMTP_FROM` | optional | From header (default: `SMTP_USER`) |
| `SMTP_SECURE` | optional | `"true"` สำหรับ port 465 |

**อีเมลแจ้งเตือนแยกตามแบรนด์:** ตั้งค่าใน **Notion Settings DB** (`NOTION_SETTINGS_DB_ID`)

| Key (title) | Value (rich_text) | คำอธิบาย |
|-------------|-------------------|----------|
| `notify_email_mazda` | `manager@example.com` | อีเมลผจก. Mazda |
| `notify_email_ford` | `ford@example.com` | อีเมลผจก. Ford |
| `notify_email_gwm` | `gwm@example.com` | อีเมลผจก. GWM |
| ... | ... | ทุกแบรนด์ |

**ลำดับการหา email:** Notion Settings (`notify_email_{brand}`) → `APPOINTMENT_NOTIFY_EMAIL` → log-only

ถ้าไม่ตั้ง email — booking ยังทำงาน แต่ระบบจะ log-only (ไม่ส่งอีเมล)

## Bola LINE Notification (Service Bookings)

ช่องทางแจ้งเตือนเพิ่มเติมจากอีเมล — เมื่อลูกค้านัดหมาย `type: "service"` (เข้าศูนย์บริการ)
ระบบจะยิง webhook ไปที่ Bola ให้ส่งข้อความ LINE ว่า `"{customer_name} มาเข้าศูนย์"`

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `BOLA_SERVICE_WEBHOOK_URL` | optional | Bola webhook URL — **ค่าต่างกันระหว่าง staging/production** ตั้งแยกกันใน Vercel (ดู "Bola webhook URL: staging vs production" ด้านล่าง) |

Payload: `POST` JSON ส่งครบทุก field ของการนัดหมาย (Bola เลือก field ที่ต้องใช้เอง):

```json
{
  "customer_name": "สมชาย ทดสอบ",
  "customer_phone": "0812345678",
  "customer_email": "somchai@example.com",
  "car_model": "Mazda CX-5",
  "branch": "มาสด้า ช.เอราวัณ นครปฐม",
  "preferred_date": "2026-07-20",
  "preferred_time": "14:00",
  "notes": "นัดเช็คระยะ 20,000 กม."
}
```

Field ที่ลูกค้าไม่ได้กรอกจะส่งเป็น `""` (string ว่าง) ไม่ใช่ omit ออกจาก payload

ถ้าไม่ตั้งค่า — booking ยังทำงานปกติ แต่ข้ามการแจ้งเตือน LINE (log-only)

### Bola webhook URL: staging vs production

**สำคัญ:** โปรเจกต์นี้มี Vercel project เดียว (`ch-erawanwebsite`) ไม่ใช่ 2 project แยกกัน —
staging คือ **Preview deployment** ของ branch `staging` ในโปรเจกต์เดียวกัน ส่วน production คือ
deployment ของ branch `master` Vercel แยกค่า env var ตาม **Environment scope** (Production /
Preview / Development) ไม่ใช่แยกตาม project

วิธีตั้งค่า:
1. Vercel dashboard → project `ch-erawanwebsite` → Settings → Environment Variables
2. เพิ่ม key `BOLA_SERVICE_WEBHOOK_URL` **2 รายการ** (key ซ้ำกันได้ ถ้า scope คนละ environment):
   - Environment = **Preview** → value = staging Bola URL (`https://bola-api.staging-th.bearyweb.com/webhook/apm/...`)
   - Environment = **Production** → value = production Bola URL (ขอจากทีม Bola ตอนพร้อมขึ้น prod จริง — คนละ URL กับ staging)
3. Save แล้ว trigger deploy ใหม่ (push commit ไปที่ branch นั้นๆ) ค่าถึงจะมีผล

⚠️ อย่ากด "Promote to Production" บน deployment ของ branch `staging` — จะ rebuild ด้วย
Production env vars แล้ว alias ของ staging จะไปชี้ deployment ที่ใช้ข้อมูล production แทน

## SPS (Service Booking System)

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `SPS_BASE_URL` | ✅ prod | Base URL ระบบ SPS เช่น `https://system.ch-erawan.com/sps` |
| `SPS_API_KEY` | ✅ prod | API key สำหรับ authenticate กับ SPS (ตั้งค่าเดียวกันในไฟล์ PHP ฝั่ง SPS) |

**ใช้ใน:**
- `/api/submit/service-booking` — proxy ส่งนัดหมายเข้า SPS
- `/api/slots` — proxy ดู slot ว่าง/เต็มจาก SPS

## Site URL

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `NEXT_PUBLIC_SITE_URL` | แนะนำ prod | Canonical/OG base URL (default: `https://www.ch-erawan.com`) |

## Google Analytics / Search Console

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | GA4 Measurement ID (`G-XXXXXXXXXX`) — ถ้าไม่ตั้ง จะไม่โหลด gtag.js เลย |
| `GOOGLE_SITE_VERIFICATION` | optional | Verification code จาก Search Console (meta tag method) |

**ตั้งใจให้ `NEXT_PUBLIC_GA_MEASUREMENT_ID` ไม่ set บน staging** — ป้องกันไม่ให้ traffic ทดสอบปนกับข้อมูลจริงใน GA4 property เดียวกัน ถ้าต้องการแยก tracking staging ให้สร้าง GA4 property ที่สอง แล้วตั้งค่าเฉพาะบน staging env

### GA4 Data API (reporting — สำหรับดึงข้อมูลออกมา ไม่ใช่ tracking script)

Service account แยกจาก Measurement ID ข้างบน — ใช้อ่านข้อมูลจาก GA4 property ผ่าน `lib/ga4.ts` (`runGa4Report()`)

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `GA4_PROPERTY_ID` | optional | GA4 Property ID (ตัวเลข เช่น `399827199`) — หาได้ที่ Admin > Property Settings |
| `GA4_CLIENT_EMAIL` | optional | Service account email จาก Google Cloud (`...@...iam.gserviceaccount.com`) |
| `GA4_PRIVATE_KEY` | optional | Private key จาก service account JSON — ใส่ทั้งบรรทัด `-----BEGIN PRIVATE KEY-----...` ใน quotes |

**Setup:**
1. สร้าง Service Account ใน Google Cloud Console + เปิดใช้ "Google Analytics Data API"
2. ดาวน์โหลด JSON key
3. เพิ่ม service account email เป็น **Viewer** ใน GA4 → Admin → Property Access Management
4. Copy `client_email`/`private_key`/property ID เข้า env vars ด้านบน
5. **ลบไฟล์ JSON key ทิ้งหลังตั้งค่าเสร็จ** — ไม่ควรมี private key แบบ plaintext ค้างอยู่ในเครื่อง

### Google Search Console API (คำค้นหา organic ต่อหน้า — `lib/gsc.ts`)

ใช้ **service account ตัวเดียวกับ GA4** (`GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY`) — ไม่ต้องเพิ่ม env var ใหม่ แต่ต้อง setup ฝั่ง Google เพิ่ม:
1. เปิดใช้ **"Google Search Console API"** ใน Google Cloud project เดียวกัน
2. เพิ่ม service account email เป็น user ใน **GSC → Settings → Users and permissions** (Full หรือ Restricted)
3. Property เป็นแบบ domain (`sc-domain:ch-erawan.com`) — hardcode ไว้ใน `lib/gsc.ts` แล้ว

**ข้อจำกัด:** GSC เก็บข้อมูลตั้งแต่วัน verify เท่านั้น + delay 2-3 วัน → หน้า `/admin/analytics` จะโชว์ "ยังไม่มีข้อมูล" จนกว่า Google index (ปกติ ~2-4 สัปดาห์)

## Revalidation

| Variable | Required | คำอธิบาย |
|----------|----------|----------|
| `REVALIDATE_SECRET` | ✅ | Secret token สำหรับ trigger ISR revalidation (generate: `openssl rand -base64 32`) |

## ตัวอย่าง `.env.local`

```bash
# Notion CMS
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_CARS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_BLOG_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_STORIES_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_APPOINTMENTS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_CONTACTS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PROMOTIONS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Better Auth + Turso (dev uses port 3002 — see package.json "dev"/"start")
BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=http://localhost:3002
TURSO_DATABASE_URL=libsql://ch-erawan-nunt.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# Revalidation
REVALIDATE_SECRET=your-random-revalidate-secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Site URL (canonical / OG)
NEXT_PUBLIC_SITE_URL=https://www.ch-erawan.com

# Google Analytics / Search Console (prod only — leave unset on staging)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_SITE_VERIFICATION=your-search-console-verification-code

# GA4 Data API (reporting) — separate service account, not the Measurement ID above
GA4_PROPERTY_ID=123456789
GA4_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SPS (Service Booking System)
SPS_BASE_URL=https://system.ch-erawan.com/sps
SPS_API_KEY=your-sps-api-key


# Appointment email fallback (per-brand emails are in Notion Settings DB)
APPOINTMENT_NOTIFY_EMAIL=service@ch-erawan.com
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=notifications@ch-erawan.com
# SMTP fallback (optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
```

## Vercel Environment Variables

ใน Vercel dashboard → Project → Settings → Environment Variables:
- ใส่ทุกตัวข้างบน
- `BETTER_AUTH_URL` ต้องเป็น production URL: `https://www.ch-erawan.com`
- `NEXT_PUBLIC_*` จะถูก expose ไปยัง browser — ไม่ควรใส่ secret
