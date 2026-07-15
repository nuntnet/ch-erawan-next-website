"use client";

import { useEffect } from "react";
import { trackClickLine, trackClickCall } from "@/lib/ga4-events";

/**
 * One global click listener instead of instrumenting every tel:/line.me/
 * lin.ee link across the site individually — several of those render inside
 * Server Components, so a per-link onClick isn't a small change. Purely
 * observational: never calls preventDefault, navigation proceeds normally.
 */
export default function OutboundClickTracker(): null {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const path = window.location.pathname;
      if (href.startsWith("tel:")) {
        trackClickCall({ path, phone: href });
      } else if (href.includes("line.me") || href.includes("lin.ee")) {
        trackClickLine({ path, lineUrl: href });
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
