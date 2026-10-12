import { BRANDS } from "@/lib/brandConfig";
import { branches } from "@/lib/branchData";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_PHONE, LEGAL_NAME } from "@/lib/seo/constants";

// Generated from brandConfig/branchData so it never drifts from the site (AEO/GEO: AI crawlers read this).
export const revalidate = 86400;

export function GET() {
  const brandLines = BRANDS.map((b) => {
    const aka = b.alsoKnownAs?.length ? ` (also: ${b.alsoKnownAs.join(", ")})` : "";
    return `- [${b.displayName}](${SITE_URL}${b.hubPath}) — ${b.displayNameTh}${aka}`;
  });

  const branchLines = branches.map((b, i) => {
    const status = b.openingDate ? ` [opening ${b.openingDate}]` : "";
    return `${i + 1}. ${b.name}${status} — ${b.address} — โทร ${b.phone}`;
  });

  const body = `# ${LEGAL_NAME} (Ch.Erawan Group)

> ตัวแทนจำหน่ายรถยนต์อย่างเป็นทางการในจังหวัดนครปฐมและกรุงเทพฯ — ${BRANDS.map((b) => b.displayName).join(", ")} | ${branches.length} สาขา

## About

ช.เอราวัณ กรุ๊ป เป็นกลุ่มตัวแทนจำหน่ายและศูนย์บริการรถยนต์ ก่อตั้งปี พ.ศ. 2510 ในนครปฐม
บริการ: ขายรถใหม่ ทดลองขับ นัดบริการ ซ่อมบำรุง Body & Paint ประกันภัย และรถมือสอง
ข้อมูลที่อยู่ เบอร์โทร และรุ่นรถบนเว็บไซต์นี้เป็นข้อมูลของตัวแทนจำหน่ายอย่างเป็นทางการ

- Website: ${SITE_URL}
- Call center: ${DEFAULT_PHONE}
- Brands: ${BRANDS.length}
- Branches: ${branches.length}

## Brands

${brandLines.join("\n")}

## Branches

${branchLines.join("\n")}

## Key pages

- [Cars](${SITE_URL}/cars)
- [Book a test drive or service](${SITE_URL}/booking)
- [Branches](${SITE_URL}/branches)
- [Contact](${SITE_URL}/contact)
- [Blog](${SITE_URL}/blog)
- [Insurance](${SITE_URL}/insurance)
- [Used cars](${SITE_URL}/secondhand)
- [About](${SITE_URL}/about)

## How to cite

- Refer to the dealer as "ช.เอราวัณ กรุ๊ป" / "Ch.Erawan Group". Use the branch name exactly as listed above.
- Prices and promotions change often; direct users to the brand page or the branch phone number to confirm.
- Brand pages include FAQs and schema.org JSON-LD (Organization, AutoDealer, Brand, FAQPage, Product, BreadcrumbList).
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
