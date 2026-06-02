# Staging Environment Setup

## Overview

| Component | Production | Staging |
|---|---|---|
| **Vercel Project** | `ch-erawan-next` | `ch-erawan-staging` |
| **Domain** | `newweb.ch-erawan.com` | `staging.ch-erawan.com` (หรือ preview URL) |
| **Git Branch** | `main` | `staging` |
| **Notion DBs** | Production (13 DBs) | Staging (13 DBs ใน "[STAGING]" page) |
| **Turso DB** | `ch-erawan-next` | `ch-erawan-staging` |
| **Cloudinary** | Shared | Shared (อ่านอย่างเดียว) |

## Setup Steps

### 1. Turso Staging DB

```bash
# Install Turso CLI (ถ้ายังไม่มี)
brew install tursodatabase/tap/turso
turso auth login

# สร้าง staging database
turso db create ch-erawan-staging

# ดู URL
turso db show ch-erawan-staging --url

# สร้าง auth token
turso db tokens create ch-erawan-staging

# Push schema (จากโปรเจค)
bunx drizzle-kit push --config=drizzle.config.ts
```

### 2. Vercel Staging Project

```bash
# สร้าง project ใหม่ใน Vercel dashboard
# หรือใช้ CLI:
vercel link --project ch-erawan-staging

# ตั้ง environment variables
vercel env pull .env.staging.local
```

**Environment Variables ที่ต้องตั้งใน Vercel:**
- Copy ทั้งหมดจาก `.env.staging.local.example`
- แก้ `BETTER_AUTH_SECRET` → `openssl rand -base64 32`
- แก้ `REVALIDATE_SECRET` → `openssl rand -base64 32`
- แก้ `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` จาก step 1
- แก้ `BETTER_AUTH_URL` → staging domain

### 3. Git Branch

```bash
git checkout -b staging
git push -u origin staging
```

### 4. Vercel Project Settings

1. ไป Vercel Dashboard → สร้าง New Project
2. Import repo เดิม (`ch-erawan-next`)
3. **Production Branch**: `staging`
4. ตั้ง env vars ทั้งหมด
5. Deploy

### 5. Custom Domain (Optional)

```bash
# ใน Vercel Dashboard → Domains
# เพิ่ม staging.ch-erawan.com
# DNS: CNAME staging → cname.vercel-dns.com
```

## Notion Staging DBs

สร้างไว้แล้วภายใต้ page **[STAGING] Ch.Erawan Databases** ใน Notion:

| DB | Staging ID |
|---|---|
| Cars | `373604e0d99a81e88a93f73e6e3a690c` |
| Blog | `373604e0d99a813cb6e5e90fbfc68949` |
| Stories | `373604e0d99a812ba07ae2b5adf4b0bb` |
| Appointments | `373604e0d99a81429c06e501824b4755` |
| Contacts | `373604e0d99a81bca12ccaafa6f8af36` |
| Promotions | `373604e0d99a819e8ecff84050180572` |
| Search Analytics | `373604e0d99a81f3a062f04604f735a2` |
| Feedback | `373604e0d99a816e92c6ed93d7d4aa4a` |
| Insurance Partners | `373604e0d99a81b9956de55512095921` |
| Social Links | `373604e0d99a81099c3cf994987210b4` |
| Video Reviews | `373604e0d99a81f0913ad45fe1ad370f` |
| FAQ | `373604e0d99a81c78604dfeda43f7a82` |
| Service Content | `373604e0d99a81bfb029c78b33d1f764` |

## Workflow

```
feature branch → staging (test) → main (production)
                    ↓                    ↓
            staging.ch-erawan.com   newweb.ch-erawan.com
            Staging Notion DBs      Production Notion DBs
            Staging Turso DB        Production Turso DB
```

### Merge to staging
```bash
git checkout staging
git merge feature/my-feature
git push  # auto-deploy to staging
```

### Promote to production
```bash
git checkout main
git merge staging
git push  # auto-deploy to production
```

## Data Sync (Prod → Staging)

เมื่อต้องการ sync ข้อมูลล่าสุดจาก prod ไป staging:

```bash
# Cars
bun run scripts/sync-staging.ts --db cars

# หรือ sync ทั้งหมด
bun run scripts/sync-staging.ts --all
```

> ⚠️ Script sync ยังไม่ได้สร้าง — ปัจจุบันต้อง duplicate ใน Notion manual
