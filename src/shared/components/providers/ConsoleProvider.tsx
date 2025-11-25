"use client";

import { useEffect } from "react";

/**
 * ConsoleProvider - ปิด console.log ใน production
 * เก็บแค่ console.error และ console.warn สำหรับ monitoring
 */
export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Disable console.log in production
    if (process.env.NODE_ENV === 'production') {
      // Disable non-critical logs
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};

      // Keep error and warn for monitoring
      // console.error remains active
      // console.warn remains active
    }
  }, []);

  return <>{children}</>;
}
