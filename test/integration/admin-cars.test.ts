import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  makeRequest,
  allowAdmin,
  denyAdmin,
  jsonBody,
} from "../helpers/integration-utils";
import { validCarBody, mockCar } from "../helpers/api-fixtures";

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  revalidatePath: vi.fn(),
  getAllCarsAdmin: vi.fn(),
  getCarById: vi.fn(),
  createCar: vi.fn(),
  updateCar: vi.fn(),
  setCarFlags: vi.fn(),
  archiveCar: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireStaff: mocks.requireStaff }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/notion", () => ({
  getAllCarsAdmin: mocks.getAllCarsAdmin,
  getCarById: mocks.getCarById,
  createCar: mocks.createCar,
  updateCar: mocks.updateCar,
  setCarFlags: mocks.setCarFlags,
  archiveCar: mocks.archiveCar,
}));

import { GET, POST, PATCH, DELETE } from "@/app/api/admin/cars/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  allowAdmin(mocks.requireStaff);
  mocks.getAllCarsAdmin.mockResolvedValue([mockCar]);
  mocks.getCarById.mockResolvedValue(mockCar);
  mocks.createCar.mockResolvedValue(mockCar);
  mocks.updateCar.mockResolvedValue(mockCar);
  mocks.setCarFlags.mockResolvedValue(undefined);
  mocks.archiveCar.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/cars", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    denyAdmin(mocks.requireStaff, 403, "Forbidden");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 503 when auth is not configured", async () => {
    denyAdmin(mocks.requireStaff, 503, "Authentication not configured");
    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("returns the car list on success", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual([mockCar]);
    expect(mocks.getAllCarsAdmin).toHaveBeenCalled();
  });

  it("returns 500 when notion throws", async () => {
    mocks.getAllCarsAdmin.mockRejectedValue(new Error("notion down"));
    const res = await GET();
    expect(res.status).toBe(500);
    await expect(jsonBody(res)).resolves.toMatchObject({ error: "Failed to fetch cars" });
  });
});

describe("POST /api/admin/cars", () => {
  it("returns 401 when not authenticated", async () => {
    denyAdmin(mocks.requireStaff, 401, "Unauthorized");
    const res = await POST(makeRequest("/api/admin/cars", { method: "POST", body: validCarBody }));
    expect(res.status).toBe(401);
  });

  it("creates a car and revalidates paths", async () => {
    const res = await POST(makeRequest("/api/admin/cars", { method: "POST", body: validCarBody }));
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual(mockCar);
    expect(mocks.createCar).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cars");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/cars/${mockCar.slug}`);
  });

  it("returns 400 for invalid zod payload", async () => {
    const res = await POST(
      makeRequest("/api/admin/cars", { method: "POST", body: { name: "" } })
    );
    expect(res.status).toBe(400);
    const body = await jsonBody<{ error: string; issues: unknown[] }>(res);
    expect(body.error).toBe("Invalid data");
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("returns 500 when createCar throws", async () => {
    mocks.createCar.mockRejectedValue(new Error("create failed"));
    const res = await POST(makeRequest("/api/admin/cars", { method: "POST", body: validCarBody }));
    expect(res.status).toBe(500);
    await expect(jsonBody(res)).resolves.toMatchObject({ error: "Create failed" });
  });
});

describe("PATCH /api/admin/cars", () => {
  it("toggles flags when only flags are sent", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/cars", {
        method: "PATCH",
        body: { id: "car-1", flags: { isBestSeller: true } },
      })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.setCarFlags).toHaveBeenCalledWith("car-1", { isBestSeller: true });
  });

  it("updates car data when data is sent", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/cars", {
        method: "PATCH",
        body: { id: "car-1", data: { model: "CX-5 Premium" } },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.updateCar).toHaveBeenCalledWith("car-1", { model: "CX-5 Premium" });
  });

  it("returns 400 when neither data nor flags provided", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/cars", { method: "PATCH", body: { id: "car-1" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid patch body", async () => {
    const res = await PATCH(
      makeRequest("/api/admin/cars", { method: "PATCH", body: { id: "" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 when update throws", async () => {
    mocks.updateCar.mockRejectedValue(new Error("update failed"));
    const res = await PATCH(
      makeRequest("/api/admin/cars", {
        method: "PATCH",
        body: { id: "car-1", data: { model: "X" } },
      })
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/admin/cars", () => {
  it("archives by id query param", async () => {
    const res = await DELETE(
      makeRequest("/api/admin/cars", { method: "DELETE", searchParams: { id: "car-1" } })
    );
    expect(res.status).toBe(200);
    await expect(jsonBody(res)).resolves.toEqual({ success: true });
    expect(mocks.archiveCar).toHaveBeenCalledWith("car-1");
  });

  it("returns 400 when id is missing", async () => {
    const res = await DELETE(makeRequest("/api/admin/cars", { method: "DELETE" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when archive throws", async () => {
    mocks.archiveCar.mockRejectedValue(new Error("archive failed"));
    const res = await DELETE(
      makeRequest("/api/admin/cars", { method: "DELETE", searchParams: { id: "car-1" } })
    );
    expect(res.status).toBe(500);
  });
});
