# Add GAC and Lepas Brands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GAC (multi-line: AION/HYPTEC/GAC MOTOR) and Lepas (single-line, coming-soon) as fully-integrated brands on ch-erawan-next — brand config, generic sub-line routing, branch data, nav, sitemap — reusing and generalizing the existing GWM sub-line architecture rather than duplicating it.

**Architecture:** GWM's sub-line system (`GwmLineSlug`, `GwmSubLine`, `matchCarToGwmLine`, hardcoded `/gwm/` hrefs in `BrandHeroSubLineLinks` and `BrandNavMenu`) is generalized into brand-agnostic types/functions (`LineSlug`, `SubLine`, `matchCarToLine`) so any brand's `subLines` render and route correctly. GAC reuses this generalized path; Lepas has no sub-lines (same shape as Mazda/Kia). A new generic `app/(brands)/[brand]/[line]/page.tsx` route serves any brand+line combo; GWM's existing static `gwm/[line]/page.tsx` still wins for `/gwm/*` (Next.js static-over-dynamic), so GWM behavior is unchanged.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest, existing `lib/brandConfig.ts` / `lib/branchData.ts` / `lib/notion-types.ts` patterns.

## Global Constraints

- Reuse existing patterns exactly — no new architecture beyond the sub-line generalization needed for GAC.
- All new Thai copy must be real (sourced from the GAC/Lepas decks), not fabricated boilerplate.
- `matchCarToGwmLine`'s public signature and behavior must not change (existing test assertions depend on it).
- GWM's rendered output (`/gwm`, `/gwm/haval` etc.) must be pixel-identical after this change — verified by running the existing test suite unmodified for GWM-specific assertions.
- Company/contact facts (must appear verbatim where used): entity **บริษัท ช.เอราวัณ เนกซ์ จำกัด**, phone **034-300-333**, opening **ตุลาคม 2569**, address/lat/lng identical to `mitsubishi-nakhonpathom` branch in `lib/branchData.ts:205,223-224`.

---

### Task 1: Generalize the sub-line type system in `lib/brandConfig.ts`

**Files:**
- Modify: `lib/brandConfig.ts:4-19` (type/interface section), `lib/brandConfig.ts:308-315` (`matchCarToGwmLine`)
- Test: `test/unit/brandConfig.test.ts`

**Interfaces:**
- Produces: `export type LineSlug = GwmLineSlug | GacLineSlug;`, `export interface SubLine { slug: LineSlug; displayName: string; displayNameTh: string; logoPath: string; modelPrefixes: string[]; }`, `export function matchCarToLine(car: Car, brand: BrandConfig, line: SubLine): boolean`
- Consumes: existing `Car` type from `lib/notion-types.ts`, existing `BrandConfig` interface (this file)

- [ ] **Step 1: Write the failing test for the new generic matcher**

Add to `test/unit/brandConfig.test.ts` (new `describe` block, after the existing GWM prefix test):

```ts
import { matchCarToLine, BRAND_BY_SLUG as _BRAND_BY_SLUG } from "@/lib/brandConfig";

describe("matchCarToLine (generic)", () => {
  it("matches GWM cars via the generic matcher identically to matchCarToGwmLine", () => {
    const car = gwmCar("HAVAL H6 HEV");
    const gwm = _BRAND_BY_SLUG.gwm;
    const havalLine = gwm.subLines!.find((l) => l.slug === "haval")!;
    expect(matchCarToLine(car, gwm, havalLine)).toBe(true);
  });

  it("rejects a car from a different brand even if model prefix matches", () => {
    const car = gwmCar("HAVAL H6 HEV");
    const notGwm = { ..._BRAND_BY_SLUG.mazda };
    const havalLine = _BRAND_BY_SLUG.gwm.subLines!.find((l) => l.slug === "haval")!;
    expect(matchCarToLine(car, notGwm, havalLine)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test test/unit/brandConfig.test.ts`
Expected: FAIL with `matchCarToLine is not exported` / `does not provide an export named 'matchCarToLine'`

- [ ] **Step 3: Implement the generic types and matcher**

In `lib/brandConfig.ts`, replace lines 4-19:

```ts
export type BrandSlug =
  | "mazda"
  | "ford"
  | "mitsubishi"
  | "gwm"
  | "deepal"
  | "kia"
  | "gac"
  | "lepas";
export type GwmLineSlug = "haval" | "ora" | "tank" | "poer";
export type GacLineSlug = "aion" | "hyptec" | "motor";
export type LineSlug = GwmLineSlug | GacLineSlug;

export interface FeaturedModel {
  name: string;
  slug: string;
}

/** Generic multi-line sub-brand entry (GWM's HAVAL/ORA/TANK/POER, GAC's AION/HYPTEC/GAC MOTOR). */
export interface SubLine {
  slug: LineSlug;
  displayName: string;
  displayNameTh: string;
  logoPath: string;
  /** Match model name prefixes (case-insensitive) */
  modelPrefixes: string[];
}

/** @deprecated Use {@link SubLine} — kept as an alias so existing GWM call sites keep compiling. */
export type GwmSubLine = SubLine;
```

Then replace the field type at what is currently line 43 (`subLines?: GwmSubLine[];`) with:

```ts
  subLines?: SubLine[];
```

Then replace `matchCarToGwmLine` (currently lines 308-315) with:

```ts
export function matchCarToLine(car: Car, brand: BrandConfig, line: SubLine): boolean {
  if (car.brand !== brand.notionBrand) return false;
  const model = car.model.toUpperCase();
  return line.modelPrefixes.some((prefix) => model.startsWith(prefix.toUpperCase()));
}

export function matchCarToGwmLine(car: Car, line: GwmLineSlug): boolean {
  return matchCarToLine(car, BRAND_BY_SLUG.gwm, GWM_LINE_BY_SLUG[line]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test test/unit/brandConfig.test.ts`
Expected: PASS — all tests including the pre-existing GWM prefix-matching test (behavior-preserving refactor)

- [ ] **Step 5: Commit**

```bash
git add lib/brandConfig.ts test/unit/brandConfig.test.ts
git commit -m "refactor(brands): generalize sub-line matching beyond GWM"
```

---

### Task 2: Add GAC and Lepas to the brand/notion type unions

**Files:**
- Modify: `lib/notion-types.ts:7` (`Car["brand"]`), `lib/notion-types.ts:98` (`Promotion["brand"]`)
- Modify: `lib/branchData.ts:15` (`Branch["brand"]`)

**Interfaces:**
- Consumes: nothing new
- Produces: `Car["brand"]`, `Promotion["brand"]`, `Branch["brand"]` all include `"GAC" | "Lepas"`

- [ ] **Step 1: Update `Car["brand"]` and `Promotion["brand"]`**

In `lib/notion-types.ts:7`, change:

```ts
  brand: "Mazda" | "Ford" | "Mitsubishi" | "GWM" | "Deepal" | "Kia";
```
to:
```ts
  brand: "Mazda" | "Ford" | "Mitsubishi" | "GWM" | "Deepal" | "Kia" | "GAC" | "Lepas";
```

In `lib/notion-types.ts:98` (the same union on `Promotion`), apply the identical change.

- [ ] **Step 2: Update `Branch["brand"]`**

In `lib/branchData.ts:15`, change:

```ts
  brand: "Mazda" | "Deepal" | "Ford" | "Mitsubishi" | "GWM" | "Kia" | "Nissan";
```
to:
```ts
  brand: "Mazda" | "Deepal" | "Ford" | "Mitsubishi" | "GWM" | "Kia" | "Nissan" | "GAC" | "Lepas";
```

- [ ] **Step 3: Run typecheck to confirm no break yet (brands not added to BRANDS[]/branches[] until later tasks)**

Run: `bunx tsc --noEmit`
Expected: PASS (widening a union is always backward compatible)

- [ ] **Step 4: Commit**

```bash
git add lib/notion-types.ts lib/branchData.ts
git commit -m "feat(brands): widen brand unions for GAC and Lepas"
```

---

### Task 3: Add `GAC_SUB_LINES` and the GAC/Lepas `BrandConfig` entries

**Files:**
- Modify: `lib/brandConfig.ts` (after `GWM_SUB_LINES`, and inside `BRANDS[]`)
- Test: `test/unit/brandConfig.test.ts`

**Interfaces:**
- Consumes: `SubLine`, `BrandConfig`, `GacLineSlug` from Task 1
- Produces: `export const GAC_SUB_LINES: SubLine[]`, two new `BRANDS[]` entries with `slug: "gac"` / `slug: "lepas"`

- [ ] **Step 1: Write the failing test**

Add to `test/unit/brandConfig.test.ts`:

```ts
describe("GAC and Lepas brand entries", () => {
  it("registers GAC with three sub-lines", () => {
    const gac = BRAND_BY_SLUG.gac;
    expect(gac.notionBrand).toBe("GAC");
    expect(gac.hubPath).toBe("/gac");
    expect(gac.subLines?.map((l) => l.slug).sort()).toEqual(["aion", "hyptec", "motor"]);
  });

  it("registers Lepas with no sub-lines", () => {
    const lepas = BRAND_BY_SLUG.lepas;
    expect(lepas.notionBrand).toBe("Lepas");
    expect(lepas.hubPath).toBe("/lepas");
    expect(lepas.subLines).toBeUndefined();
  });

  it("matches GAC cars to the correct sub-line by model prefix", () => {
    const aionCar = { ...gwmCar("AION Y Plus"), brand: "GAC" } as Car;
    const gac = BRAND_BY_SLUG.gac;
    const aionLine = gac.subLines!.find((l) => l.slug === "aion")!;
    const hyptecLine = gac.subLines!.find((l) => l.slug === "hyptec")!;
    expect(matchCarToLine(aionCar, gac, aionLine)).toBe(true);
    expect(matchCarToLine(aionCar, gac, hyptecLine)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test test/unit/brandConfig.test.ts`
Expected: FAIL — `BRAND_BY_SLUG.gac` is `undefined`, `.notionBrand` throws

- [ ] **Step 3: Add `GAC_SUB_LINES` (after `GWM_SUB_LINES`, i.e. after current line 89)**

```ts
export const GAC_SUB_LINES: SubLine[] = [
  {
    slug: "aion",
    displayName: "AION",
    displayNameTh: "เอียน",
    logoPath: "/brands/aion.svg",
    modelPrefixes: ["AION", "Aion"],
  },
  {
    slug: "hyptec",
    displayName: "HYPTEC",
    displayNameTh: "ไฮเทค",
    logoPath: "/brands/hyptec.svg",
    modelPrefixes: ["HYPTEC", "Hyptec"],
  },
  {
    slug: "motor",
    displayName: "GAC MOTOR",
    displayNameTh: "จีเอซี มอเตอร์",
    logoPath: "/brands/gac-motor.svg",
    modelPrefixes: ["GAC M8", "M8", "GAC MOTOR"],
  },
];
```

- [ ] **Step 4: Add the GAC and Lepas entries to `BRANDS[]` (append after the `kia` entry, before the closing `];` at current line 253)**

```ts
  {
    slug: "gac",
    notionBrand: "GAC",
    displayName: "GAC",
    displayNameTh: "จีเอซี",
    tagline: "WHERE CRAFT MEETS TECHNOLOGY",
    descriptionTh:
      "ตัวแทนจำหน่าย GAC อย่างเป็นทางการ ครบทั้ง AION, HYPTEC และ GAC MOTOR — รถยนต์ไฟฟ้าและ PHEV จากผู้ผลิตรถยนต์รายใหญ่ของจีน กำลังก่อสร้างโชว์รูมที่นครปฐม เปิดให้บริการตุลาคม 2569",
    logoPath: "/brands/gac.svg",
    logoScale: 1,
    accentColor: "#E31E24",
    hubPath: "/gac",
    subLines: GAC_SUB_LINES,
    featuredModels: [
      { name: "AION Y Plus", slug: "gac-aion-y-plus-2025" },
      { name: "HYPTEC HT", slug: "gac-hyptec-ht-2025" },
    ],
    showroomImageUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/brands/gac-nakhonpathom-exterior-render.png",
    social: {
      // No LINE OA yet — shares the Nakhon Pathom front desk with Mitsubishi until GAC's own is created.
      line: "https://lin.ee/N7UjCTE",
    },
  },
  {
    slug: "lepas",
    notionBrand: "Lepas",
    displayName: "Lepas",
    displayNameTh: "เลอพาส",
    tagline: "Drive Your Elegance",
    descriptionTh:
      "แบรนด์รถยนต์พรีเมียมใหม่จาก Chery Group เตรียมเปิดตัวในไทยกลางปี 2569 ด้วยกลุ่มรถ L4, L6 และ L8 — เร็วๆ นี้ที่ ช.เอราวัณ นครปฐม",
    logoPath: "/brands/lepas.svg",
    logoScale: 1,
    accentColor: "#0E8C7F",
    hubPath: "/lepas",
    featuredModels: [
      { name: "L8", slug: "lepas-l8-2026" },
      { name: "L6", slug: "lepas-l6-2026" },
    ],
    social: {
      // No LINE OA yet — shares the Nakhon Pathom front desk with Mitsubishi until Lepas's own is created.
      line: "https://lin.ee/N7UjCTE",
    },
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test test/unit/brandConfig.test.ts`
Expected: PASS

- [ ] **Step 6: Update the pre-existing brand-count assertion (it will now correctly fail — this is the expected breakage from the spec)**

In `test/unit/brandConfig.test.ts`, change:
```ts
    expect(Object.keys(BRAND_BY_SLUG)).toHaveLength(6);
```
to:
```ts
    expect(Object.keys(BRAND_BY_SLUG)).toHaveLength(8);
```

Also, the `"keeps static featuredModels as nav fallback with valid slugs"` test iterates every brand and asserts `featuredModels?.length >= 2` — GAC (2) and Lepas (2) already satisfy this, no change needed there.

- [ ] **Step 7: Run full brandConfig test file**

Run: `bun run test test/unit/brandConfig.test.ts`
Expected: PASS (all tests, 8 brands)

- [ ] **Step 8: Commit**

```bash
git add lib/brandConfig.ts test/unit/brandConfig.test.ts
git commit -m "feat(brands): add GAC (AION/HYPTEC/GAC MOTOR) and Lepas brand entries"
```

---

### Task 4: Generalize `getCarsByBrandLine` in `lib/notion.ts`

**Files:**
- Modify: `lib/notion.ts:228-236`

**Interfaces:**
- Consumes: `BRAND_BY_NOTION`, `matchCarToLine` from `lib/brandConfig.ts`
- Produces: `getCarsByBrandLine(brand: Car["brand"], line?: string): Promise<Car[]>` — same signature, brand-agnostic body

- [ ] **Step 1: Add the import**

In `lib/notion.ts`, find the existing import of brandConfig helpers (used for `isGwmLineSlug`/`matchCarToGwmLine` — locate via `grep -n "from \"@/lib/brandConfig\"" lib/notion.ts`) and add `BRAND_BY_NOTION` and `matchCarToLine` to the named imports.

- [ ] **Step 2: Replace the function body (current lines 228-236)**

```ts
export async function getCarsByBrandLine(
  brand: Car["brand"],
  line?: string
): Promise<Car[]> {
  const cars = await getActiveCars({ brand });
  if (!line) return cars;
  const brandConfig = BRAND_BY_NOTION[brand];
  const subLine = brandConfig?.subLines?.find((l) => l.slug === line);
  if (!subLine) return cars;
  return cars.filter((car) => matchCarToLine(car, brandConfig, subLine));
}
```

- [ ] **Step 3: Verify no remaining references to the now-unused `isGwmLineSlug`/`matchCarToGwmLine` imports in this file**

Run: `grep -n "isGwmLineSlug\|matchCarToGwmLine" lib/notion.ts`
Expected: no matches — if any remain, remove them from the import list (they're still exported from `brandConfig.ts` for the GWM page route and tests, just no longer needed here)

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Manual verification GWM behavior is unchanged**

Run: `bun run test` (full suite) — any existing test exercising `getCarsByBrandLine("GWM", "haval")` must still pass unchanged.

- [ ] **Step 6: Commit**

```bash
git add lib/notion.ts
git commit -m "refactor(notion): make getCarsByBrandLine brand-agnostic"
```

---

### Task 5: Fix hardcoded `/gwm/` href in `BrandHeroSubLineLinks`

**Files:**
- Modify: `components/BrandHero.tsx:200`

**Interfaces:**
- Consumes: `brand.hubPath` (already part of `BrandConfig`)
- Produces: correct per-brand sub-line links

- [ ] **Step 1: Fix the hardcoded href**

In `components/BrandHero.tsx:200`, change:
```tsx
            href={`/gwm/${line.slug}`}
```
to:
```tsx
            href={`${brand.hubPath}/${line.slug}`}
```

- [ ] **Step 2: Typecheck + manually verify GWM page unaffected**

Run: `bunx tsc --noEmit`
Expected: PASS. `brand.hubPath` for the GWM brand config is `"/gwm"`, so `/gwm/${line.slug}` is produced identically to before — zero behavior change for GWM.

- [ ] **Step 3: Commit**

```bash
git add components/BrandHero.tsx
git commit -m "fix(brand-hero): sub-line links use brand.hubPath instead of hardcoded /gwm/"
```

---

### Task 6: Generalize the GWM-only sub-line UI in `components/BrandNavMenu.tsx`

**Files:**
- Modify: `components/BrandNavMenu.tsx:141-182` (`GwmSubLineLinks`), `:184-375` (`BrandNavTile` — prop name + render condition)

**Interfaces:**
- Consumes: `BrandConfig.subLines` (generic, from Task 1/3)
- Produces: `SubLineLinks({ brand, compact, visible })` component; `BrandNavTileProps.showSubLines` replaces `showGwmSubLines`

- [ ] **Step 1: Replace `GwmSubLineLinks` (current lines 141-182) with a generic `SubLineLinks`**

```tsx
function SubLineLinks({
  brand,
  compact = false,
  visible = true,
}: {
  brand: BrandConfig;
  compact?: boolean;
  visible?: boolean;
}) {
  if (!visible || !brand.subLines?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("overflow-hidden", compact ? "mt-2" : "mt-3")}
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 px-1">
        สายย่อย {brand.displayNameTh}
      </p>
      <div className={cn("flex flex-wrap gap-1.5", compact ? "" : "justify-center")}>
        {brand.subLines.map((line) => (
          <Link
            key={line.slug}
            href={`${brand.hubPath}/${line.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-100 hover:border-[#DD5259]/40 px-2 py-1 min-h-[32px] bg-gray-50/80 hover:bg-white transition-all text-xs font-medium text-gray-600 hover:text-[#0F172A]"
          >
            <BrandLogo
              src={line.logoPath}
              alt={line.displayName}
              size="xs"
              width={48}
              height={16}
              className="opacity-80"
            />
            {line.displayName}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
```

Note: `GWM_SUB_LINES`/`getGwmLineHref` imports are still used elsewhere in this file (`GwmSubLineRow`, the deprecated export) — do not remove those imports.

- [ ] **Step 2: Update `BrandNavTileProps` and `BrandNavTile` (current lines 62-70, 184-192, 362-370)**

In the `BrandNavTileProps` interface (current lines 62-70), rename:
```ts
  showGwmSubLines?: boolean;
```
to:
```ts
  showSubLines?: boolean;
```

In the `BrandNavTile` function signature (current lines 184-192), rename the destructured prop `showGwmSubLines` to `showSubLines` (and its default `= false` stays the same), and update `active` (current line 220):
```ts
  const active = hovered || showFeatured || showSubLines;
```

Replace the GWM-only render block (current lines 362-370):
```tsx
        {brand.slug === "gwm" && (
          <AnimatePresence>
            {showGwmSubLines ? (
              <div className="pointer-events-auto relative z-20">
                <GwmSubLineLinks key="gwm-sublines" compact={compact} visible />
              </div>
            ) : null}
          </AnimatePresence>
        )}
```
with:
```tsx
        {brand.subLines?.length ? (
          <AnimatePresence>
            {showSubLines ? (
              <div className="pointer-events-auto relative z-20">
                <SubLineLinks key={`${brand.slug}-sublines`} brand={brand} compact={compact} visible />
              </div>
            ) : null}
          </AnimatePresence>
        ) : null}
```

- [ ] **Step 3: Update the only caller of `showGwmSubLines` (current line 437 in `BrandMegaMenuGrid`)**

Change:
```tsx
              showGwmSubLines={false}
```
to:
```tsx
              showSubLines={false}
```

(This prop is always passed `false` in the grid view already — sub-line hover-reveal only happens through `showFeatured`/hover state elsewhere; this rename just keeps the prop name consistent with its now-generic meaning.)

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Manually verify GWM's nav tile still renders sub-line pills identically (visual check)**

Start dev server, open `/`, hover the GWM tile in the mega nav — HAVAL/ORA/TANK/POER pills must still appear exactly as before.

- [ ] **Step 6: Commit**

```bash
git add components/BrandNavMenu.tsx
git commit -m "refactor(brand-nav): generalize sub-line pills beyond GWM"
```

---

### Task 7: Add the generic `[brand]/[line]` route for GAC's sub-lines

**Files:**
- Create: `app/(brands)/[brand]/[line]/page.tsx`

**Interfaces:**
- Consumes: `BRAND_BY_SLUG`, `isBrandSlug`, `BrandSlug`, `SubLine` from `lib/brandConfig.ts`; `getCarsByBrandLine` from `lib/notion.ts`; `BrandHero`, `BrandHeroSubLineLinks` from `components/BrandHero.tsx`; `BrandCarGrid` from `components/BrandCarGrid.tsx`
- Produces: `/gac/aion`, `/gac/hyptec`, `/gac/motor` (and any future non-GWM brand's sub-lines) — `/gwm/*` is unaffected because the static `app/(brands)/gwm/[line]/page.tsx` route takes precedence

- [ ] **Step 1: Create the route, modeled directly on `app/(brands)/gwm/[line]/page.tsx` but parametrized by brand**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import BrandCarGrid from "@/components/BrandCarGrid";
import BrandHero, { BrandHeroSubLineLinks } from "@/components/BrandHero";
import { BRAND_BY_SLUG, isBrandSlug, type BrandSlug } from "@/lib/brandConfig";
import { getCarsByBrandLine } from "@/lib/notion";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { ArrowRight } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ brand: string; line: string }>;
}

export async function generateStaticParams() {
  return Object.values(BRAND_BY_SLUG)
    .filter((b) => b.slug !== "gwm" && b.subLines?.length)
    .flatMap((b) => b.subLines!.map((line) => ({ brand: b.slug, line: line.slug })));
}

function resolve(brandSlug: string, lineSlug: string) {
  if (!isBrandSlug(brandSlug)) return null;
  const brand = BRAND_BY_SLUG[brandSlug as BrandSlug];
  const line = brand.subLines?.find((l) => l.slug === lineSlug);
  if (!line) return null;
  return { brand, line };
}

export async function generateMetadata({ params }: PageProps) {
  const { brand: brandSlug, line: lineSlug } = await params;
  const resolved = resolve(brandSlug, lineSlug);
  if (!resolved) return {};
  const { brand, line } = resolved;
  return pageMetadata({
    title: `${line.displayName} — ${brand.displayName} รถยนต์`,
    description: `รุ่นรถ ${line.displayName} จาก ${brand.displayName} ที่ ช.เอราวัณ กรุ๊ป — ${brand.descriptionTh}`,
    path: `${brand.hubPath}/${lineSlug}`,
    openGraphImage: line.logoPath,
  });
}

export default async function BrandLinePage({ params }: PageProps) {
  const { brand: brandSlug, line: lineSlug } = await params;
  const resolved = resolve(brandSlug, lineSlug);
  if (!resolved) notFound();
  const { brand, line } = resolved;
  const cars = await getCarsByBrandLine(brand.notionBrand, lineSlug);

  const breadcrumbs = [
    { name: "หน้าแรก", path: "/" },
    { name: brand.displayName, path: brand.hubPath },
    { name: line.displayName, path: `${brand.hubPath}/${lineSlug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <div className="min-h-screen bg-[#F8FAFC] pt-[68px]">
        <BrandHero
          brand={{
            ...brand,
            displayName: line.displayName,
            displayNameTh: line.displayNameTh,
            tagline: line.displayName,
            descriptionTh: `รุ่นรถ ${line.displayName} จาก ${brand.displayName} ที่ ช.เอราวัณ กรุ๊ป พร้อมทดลองขับและบริการหลังการขายครบวงจร`,
            logoPath: line.logoPath,
          }}
          breadcrumbs={breadcrumbs}
          bgImage={brand.navBgImage}
          primaryCta={{ label: "นัดทดลองขับ", href: `/booking?type=test_drive&brand=${brand.notionBrand}` }}
          secondaryCta={{ label: `ดู ${brand.displayName} ทั้งหมด`, href: brand.hubPath }}
          secondaryLogo={{ src: brand.logoPath, alt: brand.displayName, label: "by" }}
          footer={<BrandHeroSubLineLinks brand={brand} activeSlug={lineSlug} />}
        />

        <div className="container py-10 lg:py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-[#0F172A]">
                รุ่นรถ {line.displayName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">พบ {cars.length} รุ่น</p>
            </div>
            <Link
              href={brand.hubPath}
              className="hidden sm:inline-flex items-center text-sm font-medium text-[#0F172A] hover:text-[#DD5259] transition-colors"
            >
              กลับหน้า {brand.displayName}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <BrandCarGrid
            cars={cars}
            emptyMessage={`ยังไม่มีรุ่น ${line.displayName} ในระบบ — ติดต่อเราเพื่อสอบถามรุ่นที่พร้อมจำหน่าย`}
          />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify Next.js route precedence — the static GWM route still wins for `/gwm/*`**

Run: `bun dev`, then in a browser (or `curl`) check:
- `curl -s http://localhost:3002/gwm/haval | grep -o '<title>[^<]*</title>'` → unchanged GWM title (served by the static route)
- `curl -s http://localhost:3002/gac/aion | grep -o '<title>[^<]*</title>'` → `AION — GAC รถยนต์` (served by the new generic route)

Expected: both resolve, no 404, no route-conflict build error.

- [ ] **Step 3: Typecheck + build**

Run: `bunx tsc --noEmit && bun run build`
Expected: PASS, both `/gwm/[line]` and `/[brand]/[line]` routes listed in the build output without a conflict error.

- [ ] **Step 4: Commit**

```bash
git add "app/(brands)/[brand]/[line]/page.tsx"
git commit -m "feat(brands): add generic [brand]/[line] route for GAC sub-lines"
```

---

### Task 8: Add GAC/Lepas to `HAS_SUB_PAGES` sets and wire mega-nav

**Files:**
- Modify: `app/(brands)/[brand]/page.tsx:20`
- Modify: `components/BrandNavMenu.tsx:18`

**Interfaces:**
- Consumes: nothing new
- Produces: `/gac/service`, `/gac/body-repair`, `/gac/promotions`, `/gac/reviews`, `/lepas/service` etc. all resolve; mega-nav shows GAC/Lepas service quick-links on hover

- [ ] **Step 1: Update `app/(brands)/[brand]/page.tsx:20`**

Change:
```ts
const HAS_SUB_PAGES = new Set<BrandSlug>(["gwm", "mazda", "ford", "mitsubishi", "deepal", "kia"]);
```
to:
```ts
const HAS_SUB_PAGES = new Set<BrandSlug>(["gwm", "mazda", "ford", "mitsubishi", "deepal", "kia", "gac", "lepas"]);
```

- [ ] **Step 2: Update `components/BrandNavMenu.tsx:18`**

Change:
```ts
const HAS_SUB_PAGES = new Set<string>(["gwm", "mazda", "ford", "mitsubishi", "deepal", "kia"]);
```
to:
```ts
const HAS_SUB_PAGES = new Set<string>(["gwm", "mazda", "ford", "mitsubishi", "deepal", "kia", "gac", "lepas"]);
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Manual verification — mega nav shows all 8 brands**

Start dev server, open `/`, open the desktop mega nav dropdown — GAC and Lepas tiles appear in the 6-column grid (now wrapping to a 3rd row), hovering GAC shows its service quick-links row (ศูนย์บริการ / ซ่อมสี-ตัวถัง / โปรโมชั่น / รีวิวรถ) and — since `subLines?.length` is truthy for GAC — the AION/HYPTEC/GAC MOTOR pills per Task 6's generalized render.

- [ ] **Step 5: Commit**

```bash
git add "app/(brands)/[brand]/page.tsx" components/BrandNavMenu.tsx
git commit -m "feat(nav): wire GAC and Lepas into HAS_SUB_PAGES / mega nav"
```

---

### Task 9: Add GAC and Lepas branch entries with `openingDate`

**Files:**
- Modify: `lib/branchData.ts:13-35` (`Branch` interface), `lib/branchData.ts:313` (append to `branches[]`)
- Test: create `test/unit/branchData.test.ts` (no existing test file for this module)

**Interfaces:**
- Produces: `Branch.openingDate?: string`; branch entries `gac-nakhonpathom`, `lepas-nakhonpathom`

- [ ] **Step 1: Write the failing test**

Create `test/unit/branchData.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { branches, getBranchById } from "@/lib/branchData";

describe("branchData — GAC/Lepas", () => {
  it("adds GAC Nakhon Pathom co-located with Mitsubishi, not yet open", () => {
    const gac = getBranchById("gac-nakhonpathom");
    const mitsu = getBranchById("mitsubishi-nakhonpathom");
    expect(gac).toBeDefined();
    expect(gac!.brand).toBe("GAC");
    expect(gac!.companyName).toBe("บริษัท ช.เอราวัณ เนกซ์ จำกัด");
    expect(gac!.phone).toBe("034-300-333");
    expect(gac!.openingDate).toBe("ตุลาคม 2569");
    expect(gac!.lat).toBe(mitsu!.lat);
    expect(gac!.lng).toBe(mitsu!.lng);
    expect(gac!.address).toBe(mitsu!.address);
  });

  it("adds Lepas Nakhon Pathom co-located with Mitsubishi, not yet open", () => {
    const lepas = getBranchById("lepas-nakhonpathom");
    const mitsu = getBranchById("mitsubishi-nakhonpathom");
    expect(lepas).toBeDefined();
    expect(lepas!.brand).toBe("Lepas");
    expect(lepas!.companyName).toBe("บริษัท ช.เอราวัณ เนกซ์ จำกัด");
    expect(lepas!.phone).toBe("034-300-333");
    expect(lepas!.openingDate).toBe("ตุลาคม 2569");
    expect(lepas!.lat).toBe(mitsu!.lat);
    expect(lepas!.lng).toBe(mitsu!.lng);
  });

  it("existing branches have no openingDate (still-open stores)", () => {
    const mazda = getBranchById("mazda-nakhonpathom");
    expect(mazda!.openingDate).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test test/unit/branchData.test.ts`
Expected: FAIL — `gac` / `lepas` are `undefined`

- [ ] **Step 3: Add `openingDate` to the `Branch` interface (current lines 13-35, insert after `contacts: BranchContact[];`)**

```ts
export interface Branch {
  id: string;
  brand: "Mazda" | "Deepal" | "Ford" | "Mitsubishi" | "GWM" | "Kia" | "Nissan" | "GAC" | "Lepas";
  name: string;
  companyName: string;
  shortName: string;
  isHQ: boolean;
  address: string;
  phone: string;
  fax: string;
  lineId: string;
  lineUrl: string;
  hours: string;
  services: string[];
  mapUrl: string;
  mapEmbed: string;
  graphicMapUrl: string;
  lat: number;
  lng: number;
  color: string;
  directions: string[];
  contacts: BranchContact[];
  /** Set when the branch is announced but not yet operating (e.g. under construction). */
  openingDate?: string;
}
```

- [ ] **Step 4: Append the two new branch entries (after the `kia-nakhonpathom` entry, before the closing `];` at current line 313)**

```ts
  {
    id: "gac-nakhonpathom",
    brand: "GAC",
    name: "GAC ช.เอราวัณ นครปฐม",
    companyName: "บริษัท ช.เอราวัณ เนกซ์ จำกัด",
    shortName: "GAC นครปฐม",
    isHQ: false,
    address: "155 หมู่ 5 ต.ลำพยา อ.เมือง จ.นครปฐม 73000",
    phone: "034-300-333",
    fax: "034-300-390",
    lineId: "@mitsuch.erawan",
    lineUrl: "https://lin.ee/N7UjCTE",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ GAC (AION, HYPTEC, GAC MOTOR)",
      "ศูนย์บริการมาตรฐาน GAC",
      "Body & Paint (ใช้ร่วมกับ Mitsubishi นครปฐม)",
      "EV Charging Station",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/nWnAMQXmwJnrntL97",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.07!3d13.81!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ4JzM2LjAiTiAxMDDCsDA0JzEyLjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245631/ch-erawan/branch-maps/branch-map-ford-omnoi.png",
    lat: 13.804027,
    lng: 100.015492,
    color: "bg-red-600",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม มุ่งหน้าจังหวัดนครปฐม",
      "บริเวณ ต.ลำพยา อ.เมือง จ.นครปฐม (ที่ตั้งเดียวกับโชว์รูม Mitsubishi นครปฐม)",
      "โชว์รูมอยู่ระหว่างก่อสร้าง กำหนดเปิดตุลาคม 2569",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
    openingDate: "ตุลาคม 2569",
  },
  {
    id: "lepas-nakhonpathom",
    brand: "Lepas",
    name: "Lepas ช.เอราวัณ นครปฐม",
    companyName: "บริษัท ช.เอราวัณ เนกซ์ จำกัด",
    shortName: "Lepas นครปฐม",
    isHQ: false,
    address: "155 หมู่ 5 ต.ลำพยา อ.เมือง จ.นครปฐม 73000",
    phone: "034-300-333",
    fax: "034-300-390",
    lineId: "@mitsuch.erawan",
    lineUrl: "https://lin.ee/N7UjCTE",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ Lepas (L4, L6, L8)",
      "ศูนย์บริการมาตรฐาน Lepas",
      "Body & Paint (ใช้ร่วมกับ Mitsubishi นครปฐม)",
      "EV Charging Station",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/nWnAMQXmwJnrntL97",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.07!3d13.81!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ4JzM2LjAiTiAxMDDCsDA0JzEyLjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245631/ch-erawan/branch-maps/branch-map-ford-omnoi.png",
    lat: 13.804027,
    lng: 100.015492,
    color: "bg-teal-600",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม มุ่งหน้าจังหวัดนครปฐม",
      "บริเวณ ต.ลำพยา อ.เมือง จ.นครปฐม (ที่ตั้งเดียวกับโชว์รูม Mitsubishi นครปฐม)",
      "โชว์รูมอยู่ระหว่างก่อสร้าง กำหนดเปิดตุลาคม 2569",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
    openingDate: "ตุลาคม 2569",
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test test/unit/branchData.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/branchData.ts test/unit/branchData.test.ts
git commit -m "feat(branches): add GAC and Lepas Nakhon Pathom entries (opening Oct 2026)"
```

---

### Task 10: Surface the "opening soon" badge on branch cards, suppress booking CTA

**Files:**
- Modify: `components/BranchesMap.tsx`, `components/BranchesMapEmbed.tsx` (wherever each renders a branch's CTA/booking link — locate via `grep -n "booking\|นัด" components/BranchesMap.tsx components/BranchesMapEmbed.tsx`)

**Interfaces:**
- Consumes: `Branch.openingDate` (Task 9)
- Produces: a "เปิดให้บริการเร็วๆ นี้ ({openingDate})" badge replacing the booking CTA when `openingDate` is set

- [ ] **Step 1: Locate the exact branch-card CTA markup**

Run: `grep -n "นัดบริการ\|นัดทดลองขับ\|/booking" components/BranchesMap.tsx components/BranchesMapEmbed.tsx`

- [ ] **Step 2: Wrap the booking CTA with an `openingDate` check**

For each match found in Step 1, wrap the existing CTA `<Link>`/`<button>` in a conditional: when `branch.openingDate` is set, render a non-interactive badge instead —

```tsx
{branch.openingDate ? (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-xs font-semibold">
    เปิดให้บริการเร็วๆ นี้ · {branch.openingDate}
  </span>
) : (
  /* existing booking CTA markup, unchanged */
)}
```

- [ ] **Step 3: Manual verification**

Start dev server, open `/branches`, filter/scroll to GAC and Lepas — confirm the amber "เปิดให้บริการเร็วๆ นี้ · ตุลาคม 2569" badge shows instead of a booking button, and every other (already-open) branch is visually unchanged.

- [ ] **Step 4: Commit**

```bash
git add components/BranchesMap.tsx components/BranchesMapEmbed.tsx
git commit -m "feat(branches): show opening-soon badge instead of booking CTA for pre-launch branches"
```

---

### Task 11: Add brand hub pages to the sitemap

**Files:**
- Modify: `app/sitemap.ts:14-27` (`staticPages`)

**Interfaces:**
- Consumes: `BRANDS`, `BRAND_SLUGS` from `lib/brandConfig.ts`
- Produces: sitemap includes `/mazda`, `/ford`, `/mitsubishi`, `/gwm`, `/gwm/haval`, `/gwm/ora`, `/gwm/tank`, `/gwm/poer`, `/deepal`, `/kia`, `/gac`, `/gac/aion`, `/gac/hyptec`, `/gac/motor`, `/lepas` — this closes the pre-existing gap flagged in the spec (no brand hub was in the sitemap for any brand) as well as adding the two new brands.

- [ ] **Step 1: Add the import**

In `app/sitemap.ts:2`, add `BRANDS` to imports:
```ts
import { BRANDS } from "@/lib/brandConfig";
```

- [ ] **Step 2: Build brand hub + sub-line entries and append to the returned array**

After the existing `staticPages` array (current lines 14-27), add:

```ts
  const brandPages: MetadataRoute.Sitemap = BRANDS.flatMap((brand) => [
    { url: `${SITE_URL}${brand.hubPath}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    ...(brand.subLines ?? []).map((line) => ({
      url: `${SITE_URL}${brand.hubPath}/${line.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);
```

Then update the final return (current line 43):
```ts
  return [...staticPages, ...brandPages, ...blogPages, ...carPages];
```

- [ ] **Step 3: Typecheck + manual check**

Run: `bunx tsc --noEmit`
Expected: PASS

Run: `bun dev`, then `curl -s http://localhost:3002/sitemap.xml | grep -c "<loc>"` before/after to confirm the count grew by exactly `BRANDS.length + sum(subLines.length)` = 8 hub pages + 4 GWM lines + 3 GAC lines = 15 new `<loc>` entries.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): add brand hub and sub-line pages to sitemap"
```

---

### Task 12: Source real logo/showroom assets and verify the Cloudinary render upload

**Files:**
- Modify: none (asset-sourcing + one Cloudinary upload; `lib/brandConfig.ts` GAC/Lepas entries from Task 3 already reference the target paths/URLs)

**Interfaces:**
- Consumes: nothing new
- Produces: `public/brands/gac.svg`, `public/brands/aion.svg`, `public/brands/hyptec.svg`, `public/brands/gac-motor.svg`, `public/brands/lepas.svg` (real logos, official-CDN or vector-traced from official sources — matches the site's existing convention in `public/brands/`); the GAC Nakhon Pathom exterior render uploaded to Cloudinary at the URL already referenced in Task 3's `showroomImageUrl`

- [ ] **Step 1: Source GAC group + AION + HYPTEC + GAC MOTOR + Lepas logos**

Fetch official logo assets (SVG preferred, PNG fallback) from each brand's official Thailand or global site. Save into `public/brands/` using the exact filenames referenced in Task 3: `gac.svg`, `aion.svg`, `hyptec.svg`, `gac-motor.svg`, `lepas.svg`. Match the existing file convention in `public/brands/` (check `ls public/brands/` for the pattern other brands use — flat SVG/PNG, no subfolders).

- [ ] **Step 2: Upload the extracted GAC Nakhon Pathom exterior render to Cloudinary**

The render already exists locally at `/private/tmp/claude-501/-Users-nunt-ch-erawan-next/659c4f68-9f41-4bdc-93a3-ca300621adf9/scratchpad/gac-lepas/exterior-perspective-12.png` (extracted earlier via `pdftoppm`). Upload it to the `ch-erawan/brands/` Cloudinary folder so the resulting URL matches exactly what Task 3 already put in `showroomImageUrl`: `https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/ch-erawan/brands/gac-nakhonpathom-exterior-render.png`. Use whichever upload path the project already uses for admin-uploaded brand images (check `/api/upload` or the Cloudinary dashboard directly) — the public ID must be exactly `ch-erawan/brands/gac-nakhonpathom-exterior-render`.

- [ ] **Step 3: Verify the assets render correctly**

Run: `bun dev`, open `/gac` and `/gac/aion` — confirm the GAC logo, AION logo, and the exterior render all load (no 404 in Network tab / `read_network_requests`), and open `/lepas` to confirm the Lepas logo loads.

- [ ] **Step 4: Commit**

```bash
git add public/brands/gac.svg public/brands/aion.svg public/brands/hyptec.svg public/brands/gac-motor.svg public/brands/lepas.svg
git commit -m "feat(brands): add GAC/AION/HYPTEC/GAC MOTOR/Lepas logo assets"
```

---

### Task 13: Verify Notion Cars DB environment, then seed real car models

**Files:**
- None (Notion data seeding, not code) — uses the existing `scripts/seed-cars` pattern (check `package.json`'s `seed:cars` script for the exact invocation convention) or a one-off script following that same pattern

**Interfaces:**
- Consumes: `NOTION_CARS_DB_ID` env var, `Car` fields per `lib/notion-types.ts`
- Produces: Cars DB rows for GAC (AION UT, AION Y Plus, AION V, AION ES, HYPTEC HT, HYPTEC SSR, GAC M8 PHEV — all `isActive: true`) and Lepas (L4, L6, L8 — all `isActive: false`, per the spec's "coming soon" decision)

- [ ] **Step 1: Verify which Notion environment `.env.local` currently targets before writing anything**

Run: `grep NOTION_CARS_DB_ID .env.local` and cross-check the DB ID against the known staging vs. production DB IDs (per the session's established lesson that this file has previously pointed at production unexpectedly). Do not proceed to Step 2 until this is confirmed safe, or the user has explicitly confirmed which environment to seed into.

- [ ] **Step 2: Create one test car in the GAC brand to confirm the Notion select property auto-adds the option**

Using the existing car-creation path (`lib/notion.ts`'s create-car function — check `grep -n "export async function createCar" lib/notion.ts`), create a single GAC car (e.g. AION Y Plus) with `brand: "GAC"`. Open the Notion Cars DB in the browser and confirm the `Brand` select property now lists `GAC` as an option (per the spec's explicit call-out that this must be verified, not assumed).

- [ ] **Step 3: Seed the remaining real GAC and Lepas models with real pricing**

Using the same creation path, seed the remaining models from the design spec's pricing tables (`docs/superpowers/specs/2026-07-11-add-gac-lepas-brands-design.md` lines 104-128): AION UT (469,900/599,900), AION V (899,000), AION ES (859,900), HYPTEC HT (1,249,000/1,549,000), HYPTEC SSR (7,999,000/8,999,000), GAC M8 PHEV (2,499,000) — all with `isActive: true`; Lepas L4, L6 (price TBA — set `priceMin`/`priceMax` to `0` and note "ราคาจะประกาศเร็วๆ นี้" in `description`), L8 (900,000–1,000,000 est.) — all three with `isActive: false`.

- [ ] **Step 4: Verify on the live site**

Run: `bun dev`, open `/gac`, `/gac/aion`, `/gac/hyptec`, `/gac/motor` — confirm the seeded active GAC cars appear in each sub-line's `BrandCarGrid`. Open `/lepas` — confirm it shows the "coming soon" empty-state message (Lepas cars are `isActive: false` so `getActiveCars`/`getCarsByBrandLine` correctly excludes them from this listing, matching the spec's decision).

- [ ] **Step 5: No commit needed** — this task writes to Notion, not git. If a one-off seed script was created under `scripts/`, commit only that script:

```bash
git add scripts/seed-gac-lepas-cars.ts   # only if a new script file was created
git commit -m "chore(seed): script to seed GAC and Lepas car models"
```

---

## Self-Review

**Spec coverage:**
- Both brands built to same completeness ✅ Tasks 1-13 apply identically to GAC and Lepas (Lepas simply has no `subLines`/no Task-7 route entries, matching the single-brand shape).
- Full parity (brand config, sub-lines, nav, sitemap, service/body-repair/promotions/reviews, real car models) ✅ Tasks 1-3 (config), 6-8 (nav), 11 (sitemap), 8 (`HAS_SUB_PAGES` → generic `/service`/`/body-repair`/`/promotions`/`/reviews` routes automatically), 13 (cars).
- Lepas coming-soon treatment, `isActive: false` ✅ Task 13 Step 3.
- Branch entries reuse Mitsubishi's location, opening date surfaced ✅ Task 9, 10.
- Real assets sourced by assistant ✅ Task 12.
- GAC exterior render as supporting image, not primary hero ✅ Task 3's `showroomImageUrl` (not `heroBgImage`) placement.
- Notion select auto-add verification before bulk seed ✅ Task 13 Steps 1-2.
- Sitemap brand hub gap ✅ Task 11 (also retroactively fixes the pre-existing gap for all 8 brands, since it was trivial as flagged in the spec).

**Placeholder scan:** No TBD/TODO left unresolved — Lepas L4/L6 pricing is explicitly `0` + description text (spec's stated fallback), not a fabricated number.

**Type consistency:** `SubLine`/`LineSlug`/`matchCarToLine` names introduced in Task 1 are used identically in Tasks 3, 4, 6, 7. `openingDate?: string` introduced in Task 9 is consumed as-is in Task 10. `HAS_SUB_PAGES` sets updated in both locations that independently declare them (Task 8).

**Task ordering:** Tasks 1→8 are pure code/tests (safe to run `bun run test` after each). Task 9-10 (branch data + UI) are independent of 1-8 and could run in parallel, but are sequenced after for a cleaner linear commit history. Tasks 12-13 (assets, Notion) depend on Task 3's brand entries already existing (they reference the exact `showroomImageUrl`/logo paths).
