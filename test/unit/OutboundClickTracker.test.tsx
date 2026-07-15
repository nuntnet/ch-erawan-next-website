// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/lib/ga4-events");

import OutboundClickTracker from "@/components/OutboundClickTracker";
import * as ga4Events from "@/lib/ga4-events";

const trackClickLine = vi.mocked(ga4Events.trackClickLine);
const trackClickCall = vi.mocked(ga4Events.trackClickCall);

function clickLink(href: string) {
  const a = document.createElement("a");
  a.href = href;
  const span = document.createElement("span");
  span.textContent = "click me";
  a.appendChild(span);
  document.body.appendChild(a);
  span.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  document.body.removeChild(a);
}

describe("OutboundClickTracker", () => {
  beforeEach(() => {
    render(<OutboundClickTracker />);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fires trackClickCall for a tel: link, even when the click target is a nested child", () => {
    clickLink("tel:034305500");
    expect(trackClickCall).toHaveBeenCalledWith({ path: window.location.pathname, phone: "tel:034305500" });
  });

  it("fires trackClickLine for a line.me link", () => {
    clickLink("https://line.me/R/ti/p/@mazdach.erawan");
    expect(trackClickLine).toHaveBeenCalledWith({ path: window.location.pathname, lineUrl: "https://line.me/R/ti/p/@mazdach.erawan" });
  });

  it("fires trackClickLine for a lin.ee link", () => {
    clickLink("https://lin.ee/abc123");
    expect(trackClickLine).toHaveBeenCalled();
  });

  it("ignores unrelated links", () => {
    clickLink("/cars/mazda-cx-5-2025");
    expect(trackClickCall).not.toHaveBeenCalled();
    expect(trackClickLine).not.toHaveBeenCalled();
  });
});
