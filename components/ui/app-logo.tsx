"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  /**
   * ขนาดของ logo
   * - "sm": 24px (สำหรับ mobile header)
   * - "md": 32px
   * - "lg": 36px (default, สำหรับ sidebar)
   */
  size?: "sm" | "md" | "lg";
  /**
   * แสดง plan text หรือไม่
   * @default true
   */
  showPlan?: boolean;
  /**
   * แสดง app name หรือไม่
   * @default true
   */
  showName?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Custom className สำหรับ logo image
   */
  logoClassName?: string;
  /**
   * Custom className สำหรับ text container
   */
  textClassName?: string;
  /**
   * URL ที่จะ link ไป
   * @default "/"
   */
  href?: string;
}

const sizeConfig = {
  sm: {
    logoSize: 24,
    containerSize: "size-6",
    textSize: "text-xs",
    planSize: "text-[10px]",
  },
  md: {
    logoSize: 32,
    containerSize: "size-8",
    textSize: "text-sm",
    planSize: "text-xs",
  },
  lg: {
    logoSize: 36,
    containerSize: "size-9",
    textSize: "text-sm",
    planSize: "text-xs",
  },
};

export function AppLogo({
  size = "lg",
  showPlan = true,
  showName = true,
  className,
  logoClassName,
  textClassName,
  href = "/",
}: AppLogoProps) {
  const config = sizeConfig[size];
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VOOBIZE";
  const appPlan = process.env.NEXT_PUBLIC_APP_PLAN || "Free Plan";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 transition-opacity hover:opacity-80",
        className
      )}
      // Suppress hydration warning for responsive display
      suppressHydrationWarning
    >
      <div
        className={cn(
          "flex aspect-square items-center justify-center rounded-lg",
          config.containerSize,
          logoClassName
        )}
      >
        <Image
          src="/logo.png"
          alt={`${appName} Logo`}
          width={config.logoSize}
          height={config.logoSize}
          className="rounded-lg"
          priority
        />
      </div>
      {(showName || showPlan) && (
        <div
          className={cn(
            "grid flex-1 text-left leading-tight",
            textClassName
          )}
        >
          {showName && (
            <span
              className={cn(
                "truncate font-semibold",
                config.textSize
              )}
            >
              {appName}
            </span>
          )}
          {showPlan && (
            <span
              className={cn(
                "truncate text-muted-foreground",
                config.planSize
              )}
            >
              {appPlan}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
