import { describe, it, expect } from "vitest";
import { buildWebMcpTools } from "@/lib/webmcp";

const tools = buildWebMcpTools("https://example.test");
const run = (name: string, input: Record<string, unknown> = {}) => {
  const out = tools.find((t) => t.name === name)!.execute(input) as { content: { text: string }[] };
  return JSON.parse(out.content[0].text);
};

describe("webmcp tools", () => {
  it("exposes the four read-only tools", () => {
    expect(tools.map((t) => t.name)).toEqual([
      "list_brands",
      "list_branches",
      "list_geely_models",
      "get_test_drive_booking_link",
    ]);
  });

  it("filters branches by brand", () => {
    const geely = run("list_branches", { brand: "geely" });
    expect(geely).toHaveLength(1);
    expect(geely[0].name).toContain("GEELY");
  });

  it("booking link is a prefilled URL, never a submission", () => {
    const { url } = run("get_test_drive_booking_link", { brand: "Geely", model: "EX5" });
    expect(url).toBe("https://example.test/booking?type=test_drive&brand=Geely&car=EX5");
  });

  it("rejects unknown brands", () => {
    expect(run("get_test_drive_booking_link", { brand: "Nope" }).error).toContain("Unknown brand");
  });
});
