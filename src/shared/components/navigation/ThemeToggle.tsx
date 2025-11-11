"use client";

import * as React from "react";
import { Moon, Sun } from "@/config/icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // แสดง skeleton button ตอน SSR เพื่อป้องกัน hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className="opacity-50">
        <div className="h-5 w-5" />
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "เปลี่ยนเป็น Light Mode" : "เปลี่ยนเป็น Dark Mode"}
    >
      {/* Light mode → แสดง Moon (กดเพื่อเปลี่ยนเป็น dark) */}
      {/* Dark mode → แสดง Sun (กดเพื่อเปลี่ยนเป็น light) */}
      {isDark ? (
        <Moon className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-200 hover:rotate-90" />
      )}
      <span className="sr-only">
        {isDark ? "เปลี่ยนเป็น Light Mode" : "เปลี่ยนเป็น Dark Mode"}
      </span>
    </Button>
  );
}
