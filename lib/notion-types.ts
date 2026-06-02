// TypeScript interfaces matching Notion database schemas
// See architecture.md for full database structure

export interface Car {
  id: string; // Notion page ID
  name: string;
  brand: "Mazda" | "Ford" | "Mitsubishi" | "GWM" | "Deepal" | "Kia";
  model: string;
  year: number;
  type: "sedan" | "suv" | "pickup" | "hatchback" | "mpv" | "ev" | "other";
  condition: "new" | "used";
  priceMin: number;
  priceMax: number;
  engineSize: string;
  transmission: "auto" | "manual";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric" | "phev";
  description: string;
  specs: Record<string, string | number | string[]>; // parsed from JSON string
  imageUrls: string[]; // Cloudinary URLs parsed from newline-separated text
  videoUrl: string | null;
  isActive: boolean;
  isBestSeller: boolean;
  /** Display order — lower number = shown first. 0 = unset */
  sortOrder: number;
  /** Notion checkbox "Nav Featured" — mega menu highlight (แนะนำ) */
  navFeatured: boolean;
  /** Notion checkbox "Nav New" — mega menu highlight (ใหม่) */
  navNew: boolean;
  slug: string;
}

export interface BlogPost {
  id: string; // Notion page ID
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null; // Cloudinary URL
  category: "review" | "tips" | "news" | "promotion" | "csr";
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  publishedAt: string | null; // ISO date string
  authorName: string;
  // content (Notion blocks) fetched separately via notion.ts getPostContent()
}

export interface BlogPostWithContent extends BlogPost {
  contentMarkdown: string; // converted from Notion blocks via notion-to-md
}

export interface CustomerStory {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  story: string;
  rating: number; // 1-5
  carModel: string;
  imageUrl: string | null;
  status: "pending" | "approved" | "rejected";
  isPublic: boolean;
  submittedAt: string; // ISO date string
}

export interface Appointment {
  id: string;
  customerName: string;
  type: "test_drive" | "service" | "body_paint" | "insurance_quote";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  customerPhone: string;
  customerEmail: string;
  carModel: string;
  branch: string;
  preferredDate: string | null;
  preferredTime: string;
  notes: string;
  damageDescription: string;
  insuranceCompany: string;
  vehicleRegistration: string;
  coverageType: string;
  submittedAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  branch: string;
  submittedAt: string;
}

export interface Promotion {
  id: string; // Notion page ID
  title: string;
  brand: "Mazda" | "Ford" | "Mitsubishi" | "GWM" | "Deepal" | "Kia";
  coverImageUrl: string | null;
  linkUrl: string | null;
  startDate: string | null; // ISO date string
  endDate: string | null; // ISO date string
  isActive: boolean;
}

// ─── Admin write inputs ─────────────────────────────────────────────────────

/** Payload for creating a car (all fields). Update uses Partial of this. */
export type CarInput = Omit<Car, "id">;

/** Blog post metadata payload (content body is handled separately as markdown). */
export type BlogMetaInput = Omit<
  BlogPost,
  "id" | "isPublished" | "publishedAt"
> & {
  isPublished?: boolean;
  publishedAt?: string | null;
};

// Form submission types (what the API routes receive)
export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  type: Appointment["type"];
  carModel: string;
  branch: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  damageDescription?: string;
  insuranceCompany?: string;
  vehicleRegistration?: string;
  coverageType?: string;
}

export interface StoryFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  story: string;
  rating: number;
  carModel: string;
  imageUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  page: string;
  brand: string;
  isActive: boolean;
  sortOrder: number;
}

export interface VideoReview {
  id: string;
  title: string;
  brand: string;
  platform: "YouTube" | "TikTok";
  source: "own" | "external";
  videoUrl: string;
  thumbnailUrl: string | null;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BrandSocialLink {
  id: string;
  label: string;
  brand: string;
  platform: "Facebook" | "TikTok" | "YouTube" | "LINE" | "Instagram";
  url: string;
  isActive: boolean;
}

export interface InsurancePartner {
  id: string;
  name: string;
  brand: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ServicePageSection {
  id: string;
  title: string;
  page: "body-repair" | "service" | "one-stop";
  brand: string;
  sectionKey: string;
  sortOrder: number;
  isPublished: boolean;
  notionUrl: string;
}

export interface CustomerFeedback {
  id: string;
  name: string;
  type: "ร้องเรียน" | "ชมเชย" | "เสนอแนะ";
  brand: string;
  branch: string;
  department: string;
  phone: string;
  email: string;
  licensePlate: string;
  serviceDate: string | null;
  message: string;
  status: "ใหม่" | "กำลังดำเนินการ" | "แก้ไขแล้ว";
  submittedAt: string;
}

export interface FeedbackFormData {
  name: string;
  type: "ร้องเรียน" | "ชมเชย" | "เสนอแนะ";
  brand: string;
  branch: string;
  department: string;
  phone: string;
  email: string;
  licensePlate: string;
  serviceDate: string;
  message: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  branch: string;
}
