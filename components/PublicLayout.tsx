"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LineOAFloat from "./LineOAFloat";
import type { NavCountsByBrand, NavModelsByBrand } from "@/lib/navModels";

const NO_LAYOUT_PREFIXES = ["/admin", "/login"];

export default function PublicLayout({
  children,
  navModelsByBrand = {},
  navCountsByBrand = {},
}: {
  children: React.ReactNode;
  navModelsByBrand?: NavModelsByBrand;
  navCountsByBrand?: NavCountsByBrand;
}) {
  const pathname = usePathname();
  const hideLayout = NO_LAYOUT_PREFIXES.some(p => pathname.startsWith(p));

  if (hideLayout) return <>{children}</>;

  return (
    <>
      <Navbar
        navModelsByBrand={navModelsByBrand}
        navCountsByBrand={navCountsByBrand}
      />
      <main id="main-content">{children}</main>
      <Footer />
      <LineOAFloat />
    </>
  );
}
