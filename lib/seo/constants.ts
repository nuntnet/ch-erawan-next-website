import { SITE_URL } from "@/lib/site";

/** Legal / schema entity name — consistent across JSON-LD */
export const ORGANIZATION_NAME = "ช.เอราวัณ กรุ๊ป" as const;

export const LEGAL_NAME = ORGANIZATION_NAME;

export const ORGANIZATION_LEGAL_NAME = "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด";

export const DEALER_BRANDS = [
  "Mazda",
  "Ford",
  "Mitsubishi",
  "GWM",
  "Deepal",
  "Kia",
  "GAC",
  "Lepas",
] as const;

export const DEFAULT_PHONE = "094-413-3555";

export const LOGO_URL = `${SITE_URL}/logo.png`;

/** Social / knowledge-graph sameAs — extend via env when profiles exist */
export function organizationSameAs(): string[] {
  const urls: string[] = [];
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL;
  const line = process.env.NEXT_PUBLIC_LINE_OA_URL;
  if (facebook) urls.push(facebook);
  if (line) urls.push(line);
  return urls;
}
