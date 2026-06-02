import type { Car } from "@/lib/notion-types";
import { BRAND_IMAGES } from "@/lib/brandImages";

export type BrandSlug = "mazda" | "ford" | "mitsubishi" | "gwm" | "deepal" | "kia";
export type GwmLineSlug = "haval" | "ora" | "tank" | "poer";

export interface FeaturedModel {
  name: string;
  slug: string;
}

export interface GwmSubLine {
  slug: GwmLineSlug;
  displayName: string;
  displayNameTh: string;
  logoPath: string;
  /** Match model name prefixes (case-insensitive) */
  modelPrefixes: string[];
}

export interface BrandConfig {
  slug: BrandSlug;
  notionBrand: Car["brand"];
  displayName: string;
  displayNameTh: string;
  tagline?: string;
  descriptionTh: string;
  logoPath: string;
  /** Per-brand visual scale inside the uniform logo box (default 1) */
  logoScale?: number;
  /** Optional light wordmark for dark backgrounds (skips CSS invert) */
  logoLightPath?: string;
  /** How to render on dark backgrounds when `white` is set (default: invert) */
  logoOnDark?: "invert" | "native";
  /** Brand accent for hero tagline / CTA tint */
  accentColor?: string;
  /** Full-width hero background — falls back to navBgImage then BRAND_IMAGES */
  heroBgImage?: string;
  /** Faint background image for nav mega menu tiles on hover */
  navBgImage?: string;
  hubPath: string;
  featuredModels?: FeaturedModel[];
  subLines?: GwmSubLine[];
  /**
   * Showroom/dealership photo for BrandHall card hover effect.
   * Must be a Cloudinary URL. Upload via /admin → แบรนด์ หรือ Cloudinary dashboard.
   * Shape: https://res.cloudinary.com/n5llrdnq/image/upload/...
   */
  showroomImageUrl?: string;
  /** Social media links for this brand */
  social?: {
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    line?: string;      // LINE OA URL (falls back to branch lineUrl)
    instagram?: string;
  };
}

export const GWM_SUB_LINES: GwmSubLine[] = [
  {
    slug: "haval",
    displayName: "HAVAL",
    displayNameTh: "ฮาเวล",
    logoPath: "/brands/haval.svg",
    modelPrefixes: ["HAVAL", "Haval"],
  },
  {
    slug: "ora",
    displayName: "ORA",
    displayNameTh: "โอร่า",
    logoPath: "/brands/ora.svg",
    modelPrefixes: ["ORA", "Ora", "Good Cat"],
  },
  {
    slug: "tank",
    displayName: "TANK",
    displayNameTh: "แทงค์",
    logoPath: "/brands/tank.svg",
    modelPrefixes: ["TANK", "Tank"],
  },
  {
    slug: "poer",
    displayName: "POER",
    displayNameTh: "โพเออร์",
    logoPath: "/brands/poer.svg",
    modelPrefixes: ["POER", "Poer"],
  },
];

export const BRANDS: BrandConfig[] = [
  {
    slug: "mazda",
    notionBrand: "Mazda",
    displayName: "Mazda",
    displayNameTh: "มาสด้า",
    tagline: "FEEL ALIVE",
    descriptionTh:
      "ตัวแทนจำหน่ายมาสด้าอย่างเป็นทางการ รถยนต์ดีไซน์ Kodo สมรรถนะสมดุล พร้อมศูนย์บริการมาตรฐาน",
    logoPath: "/brands/mazda.svg",
    logoScale: 1.2,
    accentColor: "#910023",
    navBgImage: BRAND_IMAGES.Mazda,
    hubPath: "/mazda",
    featuredModels: [
      { name: "CX-5", slug: "mazda-cx-5-2025" },
      { name: "CX-30", slug: "mazda-cx-30-2025" },
    ],
    showroomImageUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780232080/f89626b59ed4a3e4d1e8bd9bc02425aab34baac9_pfkga4.png",
    social: {
      facebook: "https://www.facebook.com/MazdaCh.Erawan/",
      youtube: "https://www.youtube.com/@Ch.Erawan",
      line: "https://lin.ee/NLeKZy6",
    },
  },
  {
    slug: "ford",
    notionBrand: "Ford",
    displayName: "Ford",
    displayNameTh: "ฟอร์ด",
    tagline: "Built Ford Tough",
    descriptionTh:
      "ตัวแทนจำหน่ายฟอร์ดอย่างเป็นทางการ รถกระบะและ SUV ที่แข็งแกร่ง พร้อมบริการหลังการขายครบวงจร",
    logoPath: "/brands/ford.svg",
    logoOnDark: "native",
    logoScale: 1.05,
    accentColor: "#003478",
    navBgImage: BRAND_IMAGES.Ford,
    heroBgImage: BRAND_IMAGES.Ford,
    hubPath: "/ford",
    featuredModels: [
      { name: "Ranger Wildtrak", slug: "ford-ranger-wildtrak-2026" },
      { name: "Everest Platinum", slug: "ford-everest-platinum-2025" },
    ],
    showroomImageUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780232079/7d595956bfc73f66b458b3bf124456e0c87daefe_h8rdtn.png",
    social: {
      facebook: "https://www.facebook.com/FordCh.Erawan/",
      tiktok: "https://www.tiktok.com/@ch.erawan.nakhonp",
      youtube: "https://www.youtube.com/@Ch.Erawan",
      line: "https://lin.ee/PhIWeTl",
    },
  },
  {
    slug: "mitsubishi",
    notionBrand: "Mitsubishi",
    displayName: "Mitsubishi Motors",
    displayNameTh: "มิตซูบิชิ มอเตอร์ส",
    tagline: "Drive Your Ambition",
    descriptionTh:
      "ตัวแทนจำหน่ายมิตซูบิชิ มอเตอร์ส รถ SUV และกระบะที่ทนทาน เหมาะกับทุกเส้นทาง",
    logoPath: "/brands/mitsubishi.svg",
    logoScale: 0.88,
    accentColor: "#E60012",
    navBgImage: BRAND_IMAGES.Mitsubishi,
    hubPath: "/mitsubishi",
    featuredModels: [
      { name: "Triton", slug: "mitsubishi-triton-2024" },
      { name: "Xpander Cross HEV", slug: "mitsubishi-xpander-cross-hev-2026" },
    ],
    showroomImageUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780232079/2025-08-07_ehic0w.webp",
    social: {
      facebook: "https://www.facebook.com/mitsuch.erawan/",
      tiktok: "https://www.tiktok.com/@mitsubishi_ch.erawan",
      youtube: "https://www.youtube.com/@Ch.Erawan",
      line: "https://lin.ee/N7UjCTE",
    },
  },
  {
    slug: "gwm",
    notionBrand: "GWM",
    displayName: "GWM",
    displayNameTh: "จีดับเบิลยูเอ็ม",
    tagline: "Great Wall Motor",
    descriptionTh:
      "ตัวแทนจำหน่าย GWM อย่างเป็นทางการ ครบทั้ง HAVAL, ORA, TANK และ POER — SUV ไฮบริด รถไฟฟ้า และกระบะสมรรถนะสูง",
    logoPath: "/brands/gwm.png",
    logoScale: 1.15,
    accentColor: "#C8102E",
    navBgImage: BRAND_IMAGES.GWM,
    hubPath: "/gwm",
    featuredModels: [
      { name: "HAVAL H6 HEV", slug: "gwm-haval-h6-hev-2025" },
      { name: "ORA 05 BEV", slug: "gwm-ora-05-bev-2025" },
    ],
    showroomImageUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780232081/23356b8dd4f6a0f0f343dd8c5731f5b33565adf9_yogc1z.png",
    subLines: GWM_SUB_LINES,
    social: {
      facebook: "https://www.facebook.com/GWMCh.Erawan/",
      tiktok: "https://www.tiktok.com/@gwm.cherawan",
      youtube: "https://www.youtube.com/@Ch.Erawan",
      line: "https://lin.ee/xKFaZcUG",
    },
  },
  {
    slug: "deepal",
    notionBrand: "Deepal",
    displayName: "Deepal",
    displayNameTh: "ดีพอล",
    tagline: "Electric Future",
    descriptionTh:
      "ตัวแทนจำหน่าย Deepal รถยนต์ไฟฟ้าและปลั๊กอินไฮบริดจาก Changan ประเทศไทย — SUV และซีดานสมรรถนะสูง พร้อมเทคโนโลยี ADAS",
    logoPath: "/brands/deepal-dark.svg",       // horizontal wordmark (icon + DEEPAL text) on light bg
    logoLightPath: "/brands/deepal-light.svg", // same on dark bg
    logoOnDark: "native",
    logoScale: 1.15,
    accentColor: "#0066FF",
    heroBgImage: BRAND_IMAGES.Deepal,
    navBgImage: BRAND_IMAGES.Deepal,
    hubPath: "/deepal",
    showroomImageUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780232080/078345fc0504bfe8a7a869aefe1b8c3657f392be_afwo4t.png",
    social: {
      facebook: "https://www.facebook.com/deepalcherawan/",
      tiktok: "https://www.tiktok.com/@deepalsalaya",
      youtube: "https://www.youtube.com/@Ch.Erawan",
      line: "https://lin.ee/vK6Z54v",
    },
    featuredModels: [
      { name: "Lumin", slug: "deepal-lumin-2026" },
      { name: "Nevo Q05", slug: "deepal-nevo-q05-2026" },
      { name: "S05 BEV", slug: "deepal-s05-bev-2026" },
      { name: "S07 BEV", slug: "deepal-s07-bev-2026" },
      { name: "S07 L BEV", slug: "deepal-s07-l-bev-2026" },
      { name: "L07 BEV", slug: "deepal-l07-bev-2026" },
      { name: "E07 BEV", slug: "deepal-e07-bev-2026" },
      { name: "Hunter K50", slug: "deepal-hunter-k50-reev-2026" },
    ],
  },
  {
    slug: "kia",
    notionBrand: "Kia",
    displayName: "Kia",
    displayNameTh: "เกีย",
    tagline: "Movement that inspires",
    descriptionTh:
      "ตัวแทนจำหน่าย Kia อย่างเป็นทางการ รถ SUV และ MPV ดีไซน์ Opposites United",
    logoPath: "/brands/kia.svg",
    logoScale: 0.9,
    accentColor: "#BB162B",
    navBgImage: BRAND_IMAGES.Kia,
    hubPath: "/kia",
    featuredModels: [
      { name: "EV5 Air", slug: "kia-ev5-air-2025" },
      { name: "Carnival HEV", slug: "kia-carnival-hev-2025" },
    ],
    showroomImageUrl: "https://res.cloudinary.com/n5llrdnq/image/upload/v1780232079/c07d5385558a48bc887dc7c14bc8c6cd5d9ed80a_gkgjv8.png",
    social: {
      facebook: "https://www.facebook.com/KiaCh.Erawan/",
      tiktok: "https://www.tiktok.com/@kia.cherawan",
      youtube: "https://www.youtube.com/@Ch.Erawan",
      line: "https://lin.ee/XQiajzI",
    },
  },
];

export const BRAND_BY_SLUG = Object.fromEntries(
  BRANDS.map((b) => [b.slug, b])
) as Record<BrandSlug, BrandConfig>;

export const BRAND_BY_NOTION = Object.fromEntries(
  BRANDS.map((b) => [b.notionBrand, b])
) as Record<Car["brand"], BrandConfig>;

export const GWM_LINE_BY_SLUG = Object.fromEntries(
  GWM_SUB_LINES.map((l) => [l.slug, l])
) as Record<GwmLineSlug, GwmSubLine>;

export const BRAND_SLUGS: BrandSlug[] = BRANDS.map((b) => b.slug);
export const GWM_LINE_SLUGS: GwmLineSlug[] = GWM_SUB_LINES.map((l) => l.slug);

export function isBrandSlug(value: string): value is BrandSlug {
  return value in BRAND_BY_SLUG;
}

export function isGwmLineSlug(value: string): value is GwmLineSlug {
  return value in GWM_LINE_BY_SLUG;
}

export function getBrandHref(slug: BrandSlug): string {
  return BRAND_BY_SLUG[slug].hubPath;
}

export function getGwmLineHref(line: GwmLineSlug): string {
  return `/gwm/${line}`;
}

/** Map legacy ?brand= query values to hub paths */
export function legacyBrandQueryToPath(brand: string): string | null {
  const normalized = brand.trim();
  const lower = normalized.toLowerCase();

  if (isBrandSlug(lower)) return getBrandHref(lower);

  const byNotion = BRANDS.find(
    (b) => b.notionBrand.toLowerCase() === lower
  );
  if (byNotion) return byNotion.hubPath;

  if (isGwmLineSlug(lower)) return getGwmLineHref(lower);

  const gwmLine = GWM_SUB_LINES.find(
    (l) => l.displayName.toLowerCase() === lower
  );
  if (gwmLine) return getGwmLineHref(gwmLine.slug);

  return null;
}

export function matchCarToGwmLine(car: Car, line: GwmLineSlug): boolean {
  if (car.brand !== "GWM") return false;
  const config = GWM_LINE_BY_SLUG[line];
  const model = car.model.toUpperCase();
  return config.modelPrefixes.some((prefix) =>
    model.startsWith(prefix.toUpperCase())
  );
}
