import Image from "next/image";
import { BRAND_BY_SLUG, type BrandSlug } from "@/lib/brandConfig";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  xs: { box: "h-9 w-[80px]", pad: "p-1", maxH: "max-h-8" },
  sm: { box: "h-11 w-[96px]", pad: "p-1.5", maxH: "max-h-9" },
  md: { box: "h-14 w-[120px]", pad: "p-2", maxH: "max-h-11" },
  lg: { box: "h-16 w-[140px]", pad: "p-2", maxH: "max-h-12" },
  xl: { box: "h-16 w-[170px] sm:h-20 sm:w-[220px]", pad: "p-1", maxH: "max-h-[3.5rem] sm:max-h-[4.5rem] md:max-h-20" },
} as const;

export type BrandLogoSize = keyof typeof SIZE_CLASSES;

interface BrandLogoProps {
  src: string;
  alt: string;
  brandSlug?: BrandSlug;
  /** Overrides brandConfig.logoScale when set */
  scale?: number;
  size?: BrandLogoSize;
  /** Skip the uniform grey box — for hero / dark backgrounds */
  bare?: boolean;
  /** White wordmark on dark backgrounds */
  white?: boolean;
  /** Skip CSS invert — show colored/native logo (e.g. Ford oval on dark hero) */
  nativeOnDark?: boolean;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/** Brand wordmark in a uniform box — self-hosted assets in /public/brands */
export default function BrandLogo({
  src,
  alt,
  brandSlug,
  scale,
  size = "md",
  bare = false,
  white = false,
  nativeOnDark = false,
  className,
  containerClassName,
  width = 120,
  height = 40,
  priority = false,
}: BrandLogoProps) {
  const logoScale =
    scale ?? (brandSlug ? BRAND_BY_SLUG[brandSlug].logoScale : undefined) ?? 1;
  const { box, pad, maxH } = SIZE_CLASSES[size];

  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "max-w-full object-contain",
        bare ? maxH : "max-h-full",
        white && !nativeOnDark && "brightness-0 invert",
        className
      )}
      style={{ transform: logoScale !== 1 ? `scale(${logoScale})` : undefined }}
    />
  );

  if (bare) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          box,
          containerClassName
        )}
      >
        {image}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        box,
        pad,
        containerClassName
      )}
    >
      {image}
    </div>
  );
}
