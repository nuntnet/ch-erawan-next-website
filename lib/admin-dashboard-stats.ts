import type {
  Appointment,
  BlogPost,
  Car,
  ContactSubmission,
  CustomerFeedback,
  CustomerStory,
  InsurancePartner,
  Promotion,
  ServicePageSection,
  BrandSocialLink,
} from "@/lib/notion-types";

export const BRANDS = ["Mazda", "Ford", "Mitsubishi", "GWM", "Deepal", "Kia", "GAC", "Lepas"] as const;
export type BrandName = (typeof BRANDS)[number];

export function isWithinLastDays(isoDate: string | null | undefined, days: number): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

export function countByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function brandCounts(items: { brand: string }[]): Record<BrandName, number> {
  const counts = countByKey(items, (i) => i.brand);
  return Object.fromEntries(BRANDS.map((b) => [b, counts[b] ?? 0])) as Record<BrandName, number>;
}

export function carMissingGallery(car: Car): boolean {
  return car.imageUrls.filter(Boolean).length === 0;
}

export function carSingleImageOnly(car: Car): boolean {
  return car.imageUrls.filter(Boolean).length === 1;
}

export function isPromotionRunning(promo: Promotion, now = new Date()): boolean {
  if (!promo.isActive) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (promo.startDate) {
    const start = new Date(promo.startDate);
    if (!Number.isNaN(start.getTime()) && start > today) return false;
  }
  if (promo.endDate) {
    const end = new Date(promo.endDate);
    if (!Number.isNaN(end.getTime()) && end < today) return false;
  }
  return true;
}

export interface CarDashboardStats {
  total: number;
  active: number;
  inactive: number;
  newCondition: number;
  usedCondition: number;
  bestSeller: number;
  navFeatured: number;
  navNew: number;
  missingGallery: number;
  singleImageOnly: number;
  byBrand: Record<BrandName, number>;
  activeByBrand: Record<BrandName, number>;
}

export function computeCarStats(cars: Car[]): CarDashboardStats {
  const activeCars = cars.filter((c) => c.isActive);
  return {
    total: cars.length,
    active: activeCars.length,
    inactive: cars.length - activeCars.length,
    newCondition: cars.filter((c) => c.condition === "new").length,
    usedCondition: cars.filter((c) => c.condition === "used").length,
    bestSeller: cars.filter((c) => c.isBestSeller).length,
    navFeatured: cars.filter((c) => c.navFeatured).length,
    navNew: cars.filter((c) => c.navNew).length,
    missingGallery: cars.filter(carMissingGallery).length,
    singleImageOnly: cars.filter(carSingleImageOnly).length,
    byBrand: brandCounts(cars),
    activeByBrand: brandCounts(activeCars),
  };
}

export interface AppointmentDashboardStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  last7Days: number;
  byType: Record<Appointment["type"], number>;
}

const APPOINTMENT_TYPES: Appointment["type"][] = [
  "test_drive",
  "service",
  "body_paint",
  "insurance_quote",
];

export function computeAppointmentStats(appointments: Appointment[]): AppointmentDashboardStats {
  const byStatus = countByKey(appointments, (a) => a.status);
  const byType = Object.fromEntries(
    APPOINTMENT_TYPES.map((t) => [t, appointments.filter((a) => a.type === t).length]),
  ) as Record<Appointment["type"], number>;
  return {
    total: appointments.length,
    pending: byStatus.pending ?? 0,
    confirmed: byStatus.confirmed ?? 0,
    completed: byStatus.completed ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    last7Days: appointments.filter((a) => isWithinLastDays(a.submittedAt, 7)).length,
    byType,
  };
}

export interface StoryDashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  last7Days: number;
}

export function computeStoryStats(stories: CustomerStory[]): StoryDashboardStats {
  const byStatus = countByKey(stories, (s) => s.status);
  return {
    total: stories.length,
    pending: byStatus.pending ?? 0,
    approved: byStatus.approved ?? 0,
    rejected: byStatus.rejected ?? 0,
    last7Days: stories.filter((s) => isWithinLastDays(s.submittedAt, 7)).length,
  };
}

export interface BlogDashboardStats {
  total: number;
  published: number;
  draft: number;
  last7Days: number;
  byCategory: Record<BlogPost["category"], number>;
}

const BLOG_CATEGORIES: BlogPost["category"][] = [
  "review",
  "tips",
  "news",
  "promotion",
  "csr",
];

export function computeBlogStats(posts: BlogPost[]): BlogDashboardStats {
  const byCategory = Object.fromEntries(
    BLOG_CATEGORIES.map((c) => [c, posts.filter((p) => p.category === c).length]),
  ) as Record<BlogPost["category"], number>;
  const published = posts.filter((p) => p.isPublished);
  return {
    total: posts.length,
    published: published.length,
    draft: posts.length - published.length,
    last7Days: published.filter((p) => isWithinLastDays(p.publishedAt, 7)).length,
    byCategory,
  };
}

export interface ContactDashboardStats {
  total: number;
  last7Days: number;
  byBranch: Record<string, number>;
}

export function computeContactStats(contacts: ContactSubmission[]): ContactDashboardStats {
  return {
    total: contacts.length,
    last7Days: contacts.filter((c) => isWithinLastDays(c.submittedAt, 7)).length,
    byBranch: countByKey(contacts, (c) => c.branch || "ไม่ระบุสาขา"),
  };
}

export interface FeedbackDashboardStats {
  total: number;
  newCount: number;
  inProgress: number;
  resolved: number;
  last7Days: number;
  byType: Record<CustomerFeedback["type"], number>;
}

export function computeFeedbackStats(items: CustomerFeedback[]): FeedbackDashboardStats {
  const byStatus = countByKey(items, (i) => i.status);
  const byType = countByKey(items, (i) => i.type) as Record<CustomerFeedback["type"], number>;
  return {
    total: items.length,
    newCount: byStatus["ใหม่"] ?? 0,
    inProgress: byStatus["กำลังดำเนินการ"] ?? 0,
    resolved: byStatus["แก้ไขแล้ว"] ?? 0,
    last7Days: items.filter((i) => isWithinLastDays(i.submittedAt, 7)).length,
    byType,
  };
}

export interface PromotionDashboardStats {
  total: number;
  active: number;
  inactive: number;
  runningNow: number;
  byBrand: Record<BrandName, number>;
}

export function computePromotionStats(promos: Promotion[]): PromotionDashboardStats {
  return {
    total: promos.length,
    active: promos.filter((p) => p.isActive).length,
    inactive: promos.filter((p) => !p.isActive).length,
    runningNow: promos.filter((p) => isPromotionRunning(p)).length,
    byBrand: brandCounts(promos),
  };
}

export interface BrandContentStats {
  serviceSections: { total: number; published: number };
  insurancePartners: { total: number; active: number };
  socialLinks: { total: number; active: number };
}

export function computeBrandContentStats(
  sections: ServicePageSection[],
  partners: InsurancePartner[],
  socialLinks: BrandSocialLink[],
): BrandContentStats {
  return {
    serviceSections: {
      total: sections.length,
      published: sections.filter((s) => s.isPublished).length,
    },
    insurancePartners: {
      total: partners.length,
      active: partners.filter((p) => p.isActive).length,
    },
    socialLinks: {
      total: socialLinks.length,
      active: socialLinks.filter((l) => l.isActive).length,
    },
  };
}

export interface ActivitySummary {
  appointments: number;
  contacts: number;
  stories: number;
  feedback: number;
  total: number;
}

export function computeActivitySummary(
  appointments: Appointment[],
  contacts: ContactSubmission[],
  stories: CustomerStory[],
  feedback: CustomerFeedback[],
): ActivitySummary {
  const appointments7 = appointments.filter((a) => isWithinLastDays(a.submittedAt, 7)).length;
  const contacts7 = contacts.filter((c) => isWithinLastDays(c.submittedAt, 7)).length;
  const stories7 = stories.filter((s) => isWithinLastDays(s.submittedAt, 7)).length;
  const feedback7 = feedback.filter((f) => isWithinLastDays(f.submittedAt, 7)).length;
  return {
    appointments: appointments7,
    contacts: contacts7,
    stories: stories7,
    feedback: feedback7,
    total: appointments7 + contacts7 + stories7 + feedback7,
  };
}
