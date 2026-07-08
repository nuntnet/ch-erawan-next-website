import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_ASPECT = 250 / 233;

interface CompanyLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
}

/** Company shield logo — self-hosted at /logo.png */
export default function CompanyLogo({
  className,
  height = 44,
  priority = false,
}: CompanyLogoProps) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <Image
      src="/logo.png"
      alt="ช.เอราวัณ กรุ๊ป"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
