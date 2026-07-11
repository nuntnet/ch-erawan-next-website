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
