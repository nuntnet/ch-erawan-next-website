// Maps a LINE OA link (either lin.ee short link or line.me/R/ti/p/@handle)
// to the brand that owns it, so click_line events can be broken down by brand.
//
// MUST stay in sync with the LINE_ACCOUNTS arrays in components/Footer.tsx and
// components/LineOAFloat.tsx and the `line:` fields in lib/brandConfig.ts. The
// codes/handles are stable per-brand LINE Official Accounts.
//
// Note: GAC and Lepas currently reuse Mitsubishi's LINE OA (lin.ee/N7UjCTE),
// so clicks from that link resolve to "Mitsubishi" — they share one real
// account and can't be told apart.
const LINE_URL_BRAND: { match: string; brand: string }[] = [
  { match: "NLeKZy6", brand: "Mazda" },
  { match: "mazdach.erawan", brand: "Mazda" },
  { match: "vK6Z54v", brand: "Deepal" },
  { match: "deepalch.erawan", brand: "Deepal" },
  { match: "PhIWeTl", brand: "Ford" },
  { match: "fordch.erawan", brand: "Ford" },
  { match: "N7UjCTE", brand: "Mitsubishi" },
  { match: "mitsuch.erawan", brand: "Mitsubishi" },
  { match: "xKFaZcUG", brand: "GWM" },
  { match: "gwmch.erawan", brand: "GWM" },
  { match: "XQiajzI", brand: "Kia" },
  { match: "kiach.erawan", brand: "Kia" },
];

/** Returns the brand display name for a LINE URL, or null if unrecognized. */
export function brandFromLineUrl(url: string): string | null {
  for (const { match, brand } of LINE_URL_BRAND) {
    if (url.includes(match)) return brand;
  }
  return null;
}
