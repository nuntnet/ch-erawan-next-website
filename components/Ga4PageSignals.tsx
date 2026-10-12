"use client";

import { useEffect } from "react";
import { trackScrollDepth, trackViewItem, type Ga4Item } from "@/lib/ga4-events";

/** Fires view_item (optional) on mount and scroll_depth at 50/75/90% — once each — for the page it is rendered on. */
export default function Ga4PageSignals({ pageType, item }: { pageType: string; item?: Ga4Item }): null {
  useEffect(() => {
    if (item) trackViewItem(item);

    const fired = new Set<number>();
    const marks = [50, 75, 90] as const;
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      for (const m of marks) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m);
          trackScrollDepth({ percent: m, pageType });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageType, item?.itemId]);

  return null;
}
