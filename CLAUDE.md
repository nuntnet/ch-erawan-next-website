# CLAUDE.md — ch-erawan-next

เว็บไซต์ดีลเลอร์รถยนต์ **ช.เอราวัณ ออโต้ กรุป** จ.นครปฐม  
6 แบรนด์: Mazda, Ford, Mitsubishi, GWM, Deepal, Kia — 7 สาขา

## Workflow Rules

- **Do NOT** git add/commit/push/deploy after every change. Batch changes together.
- Only commit when the user **explicitly asks** to commit, push, or deploy.
- Focus on making code changes quickly without stopping for git operations.

## Git Flow

```
feature/* ──→ staging ──→ master (production)
                ↓              ↓
         staging.vercel.app   newweb.ch-erawan.com
         Staging Notion DBs   Production Notion DBs
         Staging Turso DB     Production Turso DB
```

| Branch | หน้าที่ | Vercel Project | Auto-deploy |
|---|---|---|---|
| `master` | **Production** — code ที่ใช้งานจริง | `ch-erawanwebsite` | ✅ |
| `staging` | **Staging** — ทดสอบก่อน prod | `ch-erawan-next-website-staging` | ✅ |
| `feature/*` | พัฒนา feature ใหม่ | — | — |

**ขั้นตอน:**
1. สร้าง feature branch จาก `staging`
2. ทำงาน + commit
3. Merge เข้า `staging` → auto-deploy → ทดสอบ
4. ผ่านแล้ว → merge `staging` เข้า `master` → auto-deploy production

❌ **ห้าม push ตรงไป `master` โดยไม่ผ่าน staging**

## Stack

- **Next.js 15** App Router + React 19 + TypeScript
- **Tailwind CSS 3** + Radix UI + shadcn/ui + Framer Motion
- **Notion API** — CMS หลัก (cars, blog, stories, appointments, contacts, promotions, feedback, insurance partners, service content)
- **Better Auth 1.5** + **Turso** (SQLite) — authentication + sessions
- **Cloudinary** — image hosting + admin upload
- **Upstash Redis** — rate limit `/api/auth/*` (optional in dev)
- **Google Maps JS API** — branch map
- **cmdk** — ⌘K search command palette
- **Vercel** (sin1) — deployment
- **Bun** — package manager

## Commands

```bash
bun dev          # dev server :3002 (avoids conflict with other apps on :3000)
bun build        # production build
bun start        # start prod server
bun lint         # ESLint (config TBD)
bun run test     # Vitest (unit + integration + component)
bun run test:watch
bun run test:e2e # Playwright e2e
bun run seed:cars       # seed Notion cars + Cloudinary hero/gallery images
bun run add-th-cars     # add TH-market models (does not archive existing cars)
bun run sync:galleries  # push gallery URLs from seed data into Notion
bun run audit:galleries # report cars missing gallery images in Notion
bun run infra:setup -- --env staging     # provision new environment (Notion + Turso + Vercel + git)
bun run infra:setup -- --env preview --skip turso,vercel  # Notion only
```

## Key Files

| File | Role |
|------|------|
| `lib/notion.ts` | Notion queries ทั้งหมด (read + write, retry/backoff) |
| `lib/admin-auth.ts` | `requireAdmin()` สำหรับ `/api/admin/*` |
| `lib/auth.ts` | Better Auth instance (Turso) |
| `lib/auth-client.ts` | Client-side auth hooks |
| `lib/ratelimit.ts` | Upstash rate limit auth endpoints |
| `lib/branchData.ts` | Hardcoded branch data (7 สาขา) |
| `lib/brandConfig.ts` | Brand config (6 แบรนด์, GWM sub-lines) |
| `lib/notion-types.ts` | TypeScript interfaces สำหรับ Notion data |
| `middleware.ts` | Guard `/admin/*`, `/api/admin/*`, rate limit `/api/auth/*` |
| `drizzle.config.ts` | Drizzle config สำหรับ Turso (inspect/migrate) |
| `components/SearchPalette.tsx` | ⌘K global search palette |
| `components/LineOAFloat.tsx` | Floating LINE OA widget (all pages) |
| `components/BrandSubNav.tsx` | Sticky brand sub-navigation tabs |
| `components/brands/BrandSubNav.tsx` | Brand sub-nav (scrollPastHero, sticky) |
| `docs/ADMIN.md` | คู่มือ operator — login, env, แต่ละหน้า admin |
| `specs/env-vars.md` | Template env vars |

## Routes

**Public:**
- `/` `/cars` `/cars/[slug]` `/booking` `/stories` `/blog` `/blog/[slug]`
- `/branches` `/contact` `/about` `/awards` `/insurance` `/secondhand` `/career`
- `/feedback` — ศูนย์ร้องเรียนทันใจ (แนะนำ-ติชม)

**Brand Web (ทุกแบรนด์ใช้ generic routes `app/(brands)/[brand]/`):**
- `/gwm` `/ford` `/mazda` `/mitsubishi` `/deepal` `/kia` — brand hub
- `/gwm/haval` `/gwm/ora` `/gwm/tank` — GWM sub-lines
- `/[brand]/service` — ศูนย์บริการ
- `/[brand]/body-repair` — ซ่อมสีตัวถัง (insurance list จาก Notion)
- `/[brand]/promotions` — โปรโมชั่น (Notion DB)
- `/[brand]/reviews` — รีวิว (Blog DB + Video Reviews)
- `/gwm/one-stop` — One Stop Service (GWM only)

**Admin (require role=admin):**
- `/admin` `/admin/cars` `/admin/blog` `/admin/contacts` `/admin/appointments` `/admin/stories`
- `/admin/promotions` — จัดการ promotions CRUD
- `/admin/feedback` — ดู/จัดการ customer feedback (สถานะ: ใหม่/กำลังดำเนินการ/แก้ไขแล้ว)
- `/admin/service-content` — บริษัทประกัน + Service Page Sections (link → Notion)

**Auth:** `/login`

**API:**
- `POST /api/submit/booking|contact|story|feedback`
- `POST /api/search-log` — บันทึก failed search queries → Notion analytics
- `GET|PATCH /api/admin/appointments|stories|feedback`
- `GET|POST|PATCH|DELETE /api/admin/cars|blog|promotions|insurance-partners`
- `GET|POST|PATCH /api/admin/service-content`
- `GET /api/admin/contacts` · `POST /api/admin/revalidate`
- `POST /api/upload` · `POST /api/revalidate`

## Notion Databases (11)

| Env Var | หน้าที่ |
|---------|--------|
| `NOTION_CARS_DB_ID` | รถยนต์ |
| `NOTION_BLOG_DB_ID` | บทความ (category: review/tips/news/promotion/csr, tags: brand) |
| `NOTION_STORIES_DB_ID` | รีวิวลูกค้า |
| `NOTION_APPOINTMENTS_DB_ID` | นัดหมาย |
| `NOTION_CONTACTS_DB_ID` | ข้อความติดต่อ |
| `NOTION_PROMOTIONS_DB_ID` | โปรโมชั่น (Brand, IsActive, Start/End Date) |
| `NOTION_FEEDBACK_DB_ID` | Customer Feedback (Type, Brand, Branch, Status) |
| `NOTION_SEARCH_ANALYTICS_DB_ID` | Failed search queries (Query, Count, LastSearchedAt) |
| `NOTION_INSURANCE_PARTNERS_DB_ID` | บริษัทประกัน (Name, Brand, IsActive, SortOrder) |
| `NOTION_SERVICE_CONTENT_DB_ID` | Service Page Sections (Page, Brand, SectionKey, IsPublished) |

Content แก้ที่ Notion หรือผ่าน Admin Panel — หลังแก้ trigger revalidation:
```bash
curl -X POST "http://localhost:3002/api/revalidate?secret=YOUR_SECRET"
```

## Brand Web Architecture

Brand sub-pages ใช้ pattern นี้ (GWM เป็น MVP):
- `app/(brands)/gwm/[section]/page.tsx` — static route ชนะ `gwm/[line]` dynamic
- `BrandSubNav` — sticky tab bar, `scrollPastHero` prop สำหรับ sub-pages
- `BrandSubNav` dispatch `brand-subnav-sticky` event → Navbar แสดง brand logo

เมื่อ replicate ไปแบรนด์อื่น:
- สร้าง `app/(brands)/[brand]/service/page.tsx` etc. (generic route)
- เพิ่ม brand slug ใน `HAS_SUB_PAGES` set ใน `[brand]/page.tsx`

## Search Analytics

`SearchPalette.tsx` debounce 2s → `POST /api/search-log` เมื่อ query ไม่มีผลลัพธ์  
ดู failed queries ใน Notion DB `Search Analytics` (Query, Count, LastSearchedAt)

## LINE OA

- `LineOAFloat.tsx` — floating button ทุกหน้า public (ยกเว้น admin/login)
- Footer column 4 — LINE OA cards แยกแบรนด์
- LINE IDs: Mazda `@mazdach.erawan` · Deepal `@deepalch.erawan` · Ford `@fordch.erawan` · Mitsubishi `@mitsuch.erawan` · GWM `@gwmch.erawan` · Kia `@kiach.erawan`

## Auth

- Email/password only (minPasswordLength: 8)
- Admin role เก็บใน `user.role` ใน Turso
- ถ้า `TURSO_DATABASE_URL` ไม่ถูกตั้ง — auth disabled (warning ใน console)
- สร้าง admin: sign-up แล้ว `UPDATE user SET role='admin'`

## Environment Variables

ดู `specs/env-vars.md` — Notion (10) · Better Auth (2) · Turso (2) · Cloudinary (3) · Google Maps (1) · Revalidate (1) · Upstash (2, prod แนะนำ)

## Conventions

- Server Components by default — ใช้ `"use client"` เฉพาะที่จำเป็น
- Notion data ดึงใน Server Components เท่านั้น (ไม่ expose API key ไป client)
- Form submissions → `fetch("/api/submit/...")` จาก client
- Admin data fetching → `fetch("/api/admin/...")` จาก client ใน admin pages
- Images: admin upload ผ่าน `/api/upload` → Cloudinary URL → เก็บใน Notion
- `scripts/` excluded จาก tsconfig (build utilities เท่านั้น)

## Car Data (Notion Cars DB)

- **44 active cars** ครบ 6 แบรนด์ — Gallery images 5+ imgs/คัน (official CDN เท่านั้น)
- **Specs ครบ 100%**: engine, power, torque, battery kWh, charging speed (AC/DC kW), EV range, dimensions, acceleration, features
- CDN domains: `gwm.co.th`, `kia.com`, `mazda-media-s3.s3.ap-southeast-1.amazonaws.com`, `ford.co.th`, `mitsubishi-motors.co.th`, `changan.co.th`
- Car detail page (`/cars/[slug]`) แสดง specs แบบ grouped + Thai labels + features highlight

## Known Gaps (TODO)

- ~~Brand sub-pages ยังทำแค่ GWM~~ ✅ ทำ generic routes ครบทุกแบรนด์แล้ว
- ~~`revalidatePath` หลังแก้รถใช้ Notion id แทน slug~~ ✅ ใช้ `revalidateCarsByNotionId` แล้ว
- Service Page Sections ยังไม่ render Notion content บนหน้าเว็บ (admin link → Notion แล้ว toggle publish)
- File upload (damage photos, insurance docs) ใน booking ยังไม่ implement
- ไม่มี email notifications สำหรับนัดหมายใหม่
- Video reviews (YouTube/TikTok) — ต้องเพิ่มข้อมูลลง Notion `Video Reviews DB` เพื่อให้หน้า `/[brand]/reviews` แสดงผล
- Upstash env ต้องตั้งใน prod สำหรับ rate limit
- SEO gaps: LocalBusiness JSON-LD ใน `/branches`, breadcrumbs ใน blog/about/contact
