"use client";

import { useEffect } from "react";
import { setupProductionConsole } from "@/shared/lib/utils/console";

/**
 * ConsoleProvider - ปิด console.log ใน production
 * เก็บแค่ console.error และ console.warn สำหรับ monitoring
 */
export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupProductionConsole();
  }, []);

  return <>{children}</>;
}
