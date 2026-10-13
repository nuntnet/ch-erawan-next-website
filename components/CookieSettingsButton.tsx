"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

/** Footer link that reopens the cookie banner so visitors can change their choice. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      ตั้งค่าคุกกี้
    </button>
  );
}
