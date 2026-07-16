import { describe, expect, it } from "vitest";
import type { Appointment, BlogPost, Car, Promotion } from "@/lib/notion-types";
import {
  carMissingGallery,
  computeActivitySummary,
  computeAppointmentStats,
  computeBlogStats,
  computeCarStats,
  computePromotionStats,
  isPromotionRunning,
  isWithinLastDays,
} from "@/lib/admin-dashboard-stats";

const baseCar = (overrides: Partial<Car> = {}): Car => ({
  id: "1",
  name: "Test",
  brand: "Mazda",
  model: "CX-5",
  year: 2024,
  type: "suv",
  condition: "new",
  priceMin: 1,
  priceMax: 2,
  engineSize: "2.0",
  transmission: "auto",
  fuelType: "petrol",
  description: "",
  specs: {},
  imageUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  videoUrl: null,
  isActive: true,
  isBestSeller: false,
  sortOrder: 0,
  navFeatured: false,
  navNew: false,
  slug: "test",
  ...overrides,
});

describe("admin-dashboard-stats", () => {
  it("isWithinLastDays respects cutoff", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 2);
    const old = new Date();
    old.setDate(old.getDate() - 10);
    expect(isWithinLastDays(recent.toISOString(), 7)).toBe(true);
    expect(isWithinLastDays(old.toISOString(), 7)).toBe(false);
    expect(isWithinLastDays(null, 7)).toBe(false);
  });

  it("computeCarStats aggregates car metrics", () => {
    const cars = [
      baseCar({ brand: "Mazda", isActive: true, navFeatured: true, imageUrls: [] }),
      baseCar({ id: "2", brand: "Ford", isActive: false, condition: "used", imageUrls: ["x"] }),
      baseCar({ id: "3", brand: "Mazda", isBestSeller: true, navNew: true }),
    ];
    const stats = computeCarStats(cars);
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.inactive).toBe(1);
    expect(stats.byBrand.Mazda).toBe(2);
    expect(stats.byBrand.Ford).toBe(1);
    expect(stats.missingGallery).toBe(1);
    expect(stats.singleImageOnly).toBe(1);
    expect(stats.navFeatured).toBe(1);
    expect(stats.navNew).toBe(1);
    expect(stats.bestSeller).toBe(1);
    expect(carMissingGallery(cars[0]!)).toBe(true);
  });

  it("computeAppointmentStats groups status and type", () => {
    const appointments: Appointment[] = [
      {
        id: "1",
        customerName: "A",
        type: "test_drive",
        status: "pending",
        customerPhone: "1",
        customerEmail: "a@x.com",
        carModel: "CX-5",
        branch: "b",
        preferredDate: null,
        preferredTime: "",
        notes: "",
        damageDescription: "",
        insuranceCompany: "",
        vehicleRegistration: "",
        coverageType: "",
        submittedAt: new Date().toISOString(),
        damagePhotoUrls: [],
        insuranceDocUrls: [],
      },
      {
        id: "2",
        customerName: "B",
        type: "service",
        status: "completed",
        customerPhone: "2",
        customerEmail: "b@x.com",
        carModel: "",
        branch: "b",
        preferredDate: null,
        preferredTime: "",
        notes: "",
        damageDescription: "",
        insuranceCompany: "",
        vehicleRegistration: "",
        coverageType: "",
        submittedAt: "2020-01-01",
        damagePhotoUrls: [],
        insuranceDocUrls: [],
      },
    ];
    const stats = computeAppointmentStats(appointments);
    expect(stats.pending).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.byType.test_drive).toBe(1);
    expect(stats.byType.service).toBe(1);
    expect(stats.last7Days).toBe(1);
  });

  it("computeBlogStats separates published and draft", () => {
    const posts: BlogPost[] = [
      {
        id: "1",
        title: "P",
        slug: "p",
        excerpt: "",
        coverImageUrl: null,
        category: "news",
        tags: [],
        seoTitle: "",
        seoDescription: "",
        isPublished: true,
        publishedAt: new Date().toISOString(),
        authorName: "",
      },
      {
        id: "2",
        title: "D",
        slug: "d",
        excerpt: "",
        coverImageUrl: null,
        category: "tips",
        tags: [],
        seoTitle: "",
        seoDescription: "",
        isPublished: false,
        publishedAt: null,
        authorName: "",
      },
    ];
    const stats = computeBlogStats(posts);
    expect(stats.published).toBe(1);
    expect(stats.draft).toBe(1);
    expect(stats.byCategory.news).toBe(1);
    expect(stats.byCategory.tips).toBe(1);
  });

  it("isPromotionRunning checks active date window", () => {
    const now = new Date("2026-05-15");
    const running: Promotion = {
      id: "1",
      title: "P",
      brand: "GWM",
      coverImageUrl: null,
      linkUrl: null,
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      isActive: true,
    };
    const expired: Promotion = { ...running, endDate: "2026-05-01" };
    const inactive: Promotion = { ...running, isActive: false };
    expect(isPromotionRunning(running, now)).toBe(true);
    expect(isPromotionRunning(expired, now)).toBe(false);
    expect(isPromotionRunning(inactive, now)).toBe(false);
    expect(computePromotionStats([running]).runningNow).toBeGreaterThanOrEqual(0);
  });

  it("computeActivitySummary totals last-7-day submissions", () => {
    const recent = new Date().toISOString();
    const summary = computeActivitySummary(
      [{ submittedAt: recent } as Appointment],
      [{ submittedAt: recent } as import("@/lib/notion-types").ContactSubmission],
      [],
      [],
    );
    expect(summary.total).toBe(2);
    expect(summary.appointments).toBe(1);
    expect(summary.contacts).toBe(1);
  });
});
