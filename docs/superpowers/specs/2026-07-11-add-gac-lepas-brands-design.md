# Add GAC and Lepas Brands — Design Spec

**Date:** 2026-07-11
**Status:** Approved by user, ready for implementation planning

## Context

ch-erawan-next currently supports 6 brands (Mazda, Ford, Mitsubishi, GWM, Deepal, Kia) via a
generic-route architecture: adding a brand to `BRANDS[]` in `lib/brandConfig.ts` automatically
gets it `/service`, `/body-repair`, `/promotions`, `/reviews` pages, mega-nav entry, and sitemap
inclusion. GWM additionally has a `subLines` array (HAVAL, ORA, TANK, POER) rendered via a
`[brand]/[line]` dynamic route.

The user (dealer group owner) is adding two new brands, researched from two investor/dealer PDFs:

- **GAC** — real, active business. Thai entity "Aion Automobile Sales (Thailand) Co., Ltd."
  already operates 59 dealers nationally. The user's own Nakhon Pathom location is one of 10
  currently under construction (per `GAC Introduction_20251111.pdf` dealer network slide),
  confirmed via a separate architectural preliminary-design PDF
  (`PRELIMINARY DESIGN - GAC - NAKHON PATHOM - 26-03-21.pdf`) showing a real building (showroom
  402 sqm + workshop 978 sqm) with an actual exterior 3D render (page A-12) bearing the
  "ช.เอราวัณ นครปฐม" signage. GAC Thailand sells under a 3-line matrix: **AION** (EV mainstream),
  **HYPTEC** (EV luxury/performance), **GAC MOTOR** (ICE/PHEV, e.g. the M8 MPV) — structurally
  identical to GWM's HAVAL/ORA/TANK/POER pattern.
- **Lepas** — Chery Group's new premium sub-brand (positioned above OMODA/JAECOO, below
  Jaguar Land Rover, in Chery's brand hierarchy). Thailand launch is confirmed by the user but
  pre-market: teaser phase Jan–Apr 2026, showrooms/test-drives start 27 Jun 2026. Product line:
  L4 (BEV, vs BYD Atto3), L6 (BEV, vs Corolla Cross), L8 (PHEV/BEV, vs Honda CR-V,
  est. 900,000–1,000,000 THB). Single-line brand (no sub-lines), same shape as Mazda/Kia/etc.

Both new locations are **co-located with the existing Mitsubishi Nakhon Pathom branch**
(`155 หมู่ 5 ต.ลำพยา อ.เมือง จ.นครปฐม 73000`, lat 13.804027 / lng 100.015492) — same map pin for
now, per the user. Body & Paint services are shared with the Mitsubishi facility. Operating
entity: **บริษัท ช.เอราวัณ เนกซ์ จำกัด**, phone `034-300-333` (same phone as Mitsubishi — shared
front desk), opening **ตุลาคม 2569 (October 2026)**.

## Decisions from brainstorming

1. Both brands built to the same level of completeness in this pass (not staged GAC-then-Lepas).
2. Full parity treatment: brand config, sub-lines (GAC only), nav, sitemap, service/body-repair/
   promotions/reviews pages, real car models with real 2025/2026 pricing from the decks.
3. Lepas car listings are seeded as real (not fabricated) models but marked **not yet orderable**
   — visible on the brand hub with a "เร็วๆ นี้" (coming soon) treatment, `isActive: false` in
   Notion so they don't appear in the main `/cars` search yet. This matches the real launch
   timeline (mid-2026) instead of pretending stock is available today.
4. Branch entries for both reuse Mitsubishi Nakhon Pathom's exact address/map pin, with the
   opening date surfaced (not hidden) since the store isn't open yet.
5. Logo and product photography sourced by the assistant from official brand
   Thailand/manufacturer sites — same convention as the site's existing brand assets (official
   CDNs only, no stock/fan photography). The GAC Nakhon Pathom exterior 3D render (extracted from
   the architectural PDF page A-12) is a real, dealer-specific asset — use it as the featured
   image on the GAC brand hub or branch card, not a hero background (it's a render, not a photo,
   so it reads better as a supporting "coming soon" visual than the primary landing hero).

## Data model changes

### `lib/brandConfig.ts`
- Add `"GAC"` and `"Lepas"` to the `Car["brand"]` union (defined in `lib/notion-types.ts`) and to
  `BrandConfig["notionBrand"]`.
- Add a `GAC_SUB_LINES` array (mirrors `GWM_SUB_LINES`): AION, HYPTEC, GAC MOTOR — each with
  `slug`, `displayName`, `logoPath`, `modelPrefixes` (used to filter cars by sub-line, mirroring
  how HAVAL/ORA/TANK/POER filter GWM's cars by model name prefix).
- Add `GAC` brand entry: `slug: "gac"`, `accentColor` from the deck's red (`#E31E24`-ish, will
  sample the exact hex from the sourced logo), `subLines: GAC_SUB_LINES`, tagline "WHERE CRAFT
  MEETS TECHNOLOGY".
- Add `Lepas` brand entry: `slug: "lepas"`, accent color sampled from the deck's teal/green
  (Lepas L8 signature color), tagline "Drive Your Elegance", no `subLines`.
- Both need `featuredModels`, `showroomImageUrl` (GAC: the extracted exterior render, uploaded to
  Cloudinary under `ch-erawan/brands/`; Lepas: an official L8 studio shot), `social.line` (⚠️ no
  LINE OA exists yet for either brand — placeholder using the shared branch phone until the user
  sets one up; flagged, not blocking).

### `lib/branchData.ts`
- `Branch["brand"]` union gets `"GAC" | "Lepas"` added.
- Two new branch entries (`gac-nakhonpathom`, `lepas-nakhonpathom`), both cloning Mitsubishi
  Nakhon Pathom's `address`/`lat`/`lng`/`mapUrl`/`mapEmbed`/`directions`, with
  `companyName: "บริษัท ช.เอราวัณ เนกซ์ จำกัด"`, `phone: "034-300-333"`.
- **New optional field** `openingDate?: string` added to the `Branch` interface (backward
  compatible) — both new branches set `openingDate: "ตุลาคม 2569"`. Branch card UI (wherever
  branches render — `/branches`, brand `/service` pages) shows an "เปิดให้บริการเร็วๆ นี้" badge
  when this field is present, instead of the normal "นัดบริการ" CTA (booking a service visit at a
  store that doesn't exist yet would be broken).

### Notion (Cars, Service Content, FAQ, Promotions DBs)
- These have `Brand` as a Notion `select` property with a fixed option list (confirmed earlier
  this session — e.g. Service Content DB's Brand select is `["GWM","Mazda","Ford","Mitsubishi",
  "Deepal","Kia"]`, no auto "any value" support). Adding `"GAC"` and `"Lepas"` as new Cars appear
  via ordinary page creation (Notion's API auto-adds new select option values on write by
  default) — no manual schema edit needed, but this will be explicitly verified for the Cars DB
  during implementation (create one car, confirm the option appears) before bulk-seeding.

### Sitemap (`app/sitemap.ts`)
- Already iterates `getCarSitemapEntries()`/`getBlogSitemapEntries()` dynamically — new cars
  appear automatically once seeded. Brand hub paths (`/gac`, `/gac/aion`, `/gac/hyptec`,
  `/gac/motor`, `/lepas`) need **explicit static entries** added to `staticPages[]`, matching the
  existing pattern (none of the other 6 brand hubs are in there either — checking during
  implementation whether brand hubs are in the static list at all, since the current file only
  lists top-level pages like `/cars`, `/blog`, not `/mazda` etc. If brand hub pages are missing
  from all brands today, that's a pre-existing gap outside this task's scope — flagging, not
  fixing unless trivial).

## Content to seed (real, from the decks)

**GAC / AION:**
| Model | Price (THB) | Type |
|---|---|---|
| AION UT (Standard/Premium) | 469,900 / 599,900 | Hatchback EV |
| AION Y Plus (410/490 Premium) | 769,900 / 829,900 | SUV EV |
| AION V (Luxury) | 899,000 | SUV EV |
| AION ES | 859,900 | Sedan EV |

**GAC / HYPTEC:**
| Model | Price (THB) | Type |
|---|---|---|
| HYPTEC HT (Premium/Luxury gull-wing) | 1,249,000 / 1,549,000 | Luxury SUV EV |
| HYPTEC SSR (/ Sprint) | 7,999,000 / 8,999,000 | Super car EV |

**GAC MOTOR:**
| Model | Price (THB) | Type |
|---|---|---|
| GAC M8 PHEV | 2,499,000 | MPV 7-seat |

**Lepas** (marked coming-soon, `isActive: false`):
| Model | Price (THB) | Type |
|---|---|---|
| L4 | TBD (positioned vs BYD Atto3) | A0-SUV BEV |
| L6 | TBD (positioned vs Corolla Cross) | SUV BEV |
| L8 | 900,000–1,000,000 (est.) | SUV PHEV/BEV |

## Out of scope for this pass
- Exact LINE OA account IDs for GAC/Lepas (none exist yet) — using shared branch phone as the
  contact fallback, flagged for the user to update once LINE OA accounts are created.
- Precise opening-day photography (building isn't finished) — using the architectural render as
  a placeholder image, swappable later.
- Lepas L4/L6 exact THB pricing (deck only gives L8 an estimate) — will state "ราคาจะประกาศเร็วๆ
  นี้" (price TBA) rather than inventing a number.

## Self-review notes
- No placeholders left unresolved that block implementation — all flagged as explicit
  "out of scope" items with a clear fallback behavior, not silent gaps.
- Verified internal consistency: GAC's sub-line pattern reuses GWM's existing code path (no new
  architecture), Lepas reuses the existing single-brand path (no new architecture) — this keeps
  the change additive/low-risk rather than introducing new patterns.
- Scope check: this is one cohesive feature (two brand additions using 100% existing
  architecture) — no further decomposition needed for the implementation plan.
