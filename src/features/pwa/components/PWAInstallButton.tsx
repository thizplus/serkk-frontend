"use client";

import { useEffect, useState } from "react";
import { Download, X } from "@/shared/config/icons";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * PWAInstallButton Component
 *
 * แสดงปุ่ม Install PWA ใน header
 * - แสดงเฉพาะ user ที่ยังไม่ได้ติดตั้ง
 * - รองรับทั้ง Android และ iOS
 * - มี animation สวยๆ
 * - Reliable: แสดงสม่ำเสมอ ไม่หายบ่อย
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Global state สำหรับเก็บ deferredPrompt ข้ามหน้า
declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 [PWA Install] Component mounted, checking status...");
    console.log("🌐 [PWA Install] Current URL:", window.location.href);

    // 🎯 Hybrid Detection: 3-Layer Check
    const checkIfInstalled = async () => {
      // === Layer 1: getInstalledRelatedApps() API (Chrome/Edge) ===
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            console.log("✅ [PWA Install] Detected via getInstalledRelatedApps():", relatedApps);
            setIsInstalled(true);
            return true;
          }
        } catch (error) {
          console.log("⚠️ [PWA Install] getInstalledRelatedApps() failed:", error);
        }
      }

      // === Layer 2: Standalone Mode Detection (All browsers) ===
      // Check if running in standalone mode (installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        console.log("✅ [PWA Install] Already installed (standalone mode)");
        setIsInstalled(true);
        // Set localStorage flag for future checks
        try {
          localStorage.setItem("pwa-installed", "true");
        } catch (e) {}
        return true;
      }

      // Check if running as PWA on iOS
      if ((window.navigator as any).standalone === true) {
        console.log("✅ [PWA Install] Already installed (iOS standalone)");
        setIsInstalled(true);
        // Set localStorage flag for future checks
        try {
          localStorage.setItem("pwa-installed", "true");
        } catch (e) {}
        return true;
      }

      // === Layer 3: localStorage Flag (Fallback) ===
      try {
        const installedFlag = localStorage.getItem("pwa-installed");
        if (installedFlag === "true") {
          console.log("✅ [PWA Install] Already installed (localStorage flag)");
          setIsInstalled(true);
          return true;
        }
      } catch (error) {
        console.error("❌ [PWA Install] localStorage error:", error);
      }

      console.log("ℹ️ [PWA Install] Not installed yet (checked 3 layers)");
      return false;
    };

    // ตรวจสอบว่า dismiss ไปหรือยัง (persist ใน localStorage)
    const checkDismissed = () => {
      try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed) {
          const dismissedTime = parseInt(dismissed, 10);
          const now = Date.now();

          if (now - dismissedTime < DISMISS_DURATION) {
            const remainingDays = Math.ceil((DISMISS_DURATION - (now - dismissedTime)) / (24 * 60 * 60 * 1000));
            console.log(`⏸️ [PWA Install] Manually dismissed (${remainingDays} days remaining)`);
            setShowPrompt(false);
            return true;
          } else {
            // หมดอายุแล้ว ลบออก
            localStorage.removeItem(DISMISS_KEY);
            console.log("✅ [PWA Install] Dismiss expired, showing again");
          }
        }
      } catch (error) {
        console.error("❌ [PWA Install] localStorage error:", error);
      }
      return false;
    };

    // Run async checks
    const runChecks = async () => {
      // ถ้าติดตั้งแล้ว ไม่ต้องแสดงปุ่ม
      const installed = await checkIfInstalled();
      if (installed) {
        setIsLoading(false);
        return;
      }

      // ถ้า dismiss ไปแล้ว (กดปุ่ม × เอง) ไม่แสดง
      if (checkDismissed()) {
        setIsLoading(false);
        return;
      }

      // เช็คว่ามี prompt ใน global state หรือยัง
      if (window.__pwaInstallPrompt) {
        console.log("🔄 [PWA Install] Found existing prompt in global state");
        console.log("📦 [PWA Install] Prompt object:", window.__pwaInstallPrompt);
        setDeferredPrompt(window.__pwaInstallPrompt);
        setIsInstallable(true);
      } else {
        console.log("⏳ [PWA Install] No prompt in global state yet, waiting for event...");
      }

      // แสดงปุ่มทันที (fallback) แม้ beforeinstallprompt ยังไม่มา
      setIsInstallable(true);
      setIsLoading(false);
      console.log("✅ [PWA Install] Button ready (fallback mode)");
    };

    // Listen for beforeinstallprompt event (fire ครั้งเดียวต่อ session)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;

      console.log("🎯 [PWA Install] *** beforeinstallprompt EVENT FIRED! ***");
      console.log("📍 [PWA Install] Fired at URL:", window.location.href);
      console.log("📦 [PWA Install] Event object:", promptEvent);

      // เก็บใน global state เพื่อให้ทุกหน้าใช้ได้
      window.__pwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      console.log("✅ [PWA Install] Install prompt captured and saved globally!");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("✅ [PWA Install] App installed successfully!");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);

      // ลบ global state
      delete window.__pwaInstallPrompt;

      // บันทึกว่าติดตั้งแล้ว
      try {
        localStorage.setItem("pwa-installed", "true");
      } catch (error) {
        console.error("❌ [PWA Install] localStorage error:", error);
      }
    };

    // Check Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          console.log("✅ [PWA Install] Service Worker registered:", reg.active?.state);
        } else {
          console.log("⚠️ [PWA Install] Service Worker NOT registered yet");
        }
      });
    }

    // Run all checks
    runChecks();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log("👆 [PWA Install] Button clicked!");
    console.log("🔍 [PWA Install] Checking for install prompt...");
    console.log("📍 [PWA Install] Current URL:", window.location.href);
    console.log("📦 [PWA Install] Local state (deferredPrompt):", deferredPrompt);
    console.log("🌐 [PWA Install] Global state (window.__pwaInstallPrompt):", window.__pwaInstallPrompt);

    // ลองเช็ค global state ก่อน ถ้าไม่มี local state
    const promptToUse = deferredPrompt || window.__pwaInstallPrompt;

    if (!promptToUse) {
      console.log("⚠️ [PWA Install] No install prompt available (event hasn't fired yet)");
      // Silent fail - ไม่แจ้ง user, ให้ลองหน้าอื่นเอง
      return;
    }

    console.log("✅ [PWA Install] Prompt available! Using:", promptToUse === deferredPrompt ? "local state" : "global state");

    try {
      console.log("🚀 [PWA Install] Showing install prompt...");

      // Show the install prompt
      await promptToUse.prompt();

      // Wait for user choice
      const { outcome } = await promptToUse.userChoice;

      console.log(`📊 [PWA Install] User choice: ${outcome}`);

      if (outcome === "accepted") {
        console.log("✅ [PWA Install] User accepted installation");
        // ปุ่มจะหายเองเมื่อ appinstalled event fire
        // ลบ prompt ออกจาก global state
        delete window.__pwaInstallPrompt;
        setDeferredPrompt(null);
      } else {
        console.log("🤷 [PWA Install] User cancelled installation");
        console.log("💡 [PWA Install] Button will remain visible for next time");
        // ไม่ทำอะไร - ปุ่มยังแสดงอยู่ให้ user ลองอีกครั้ง
        // ถ้าอยากซ่อน ต้องกดปุ่ม × เอง
      }
    } catch (error) {
      console.error("❌ [PWA Install] Install error:", error);
    }
  };

  const handleDismiss = () => {
    console.log("🙈 [PWA Install] Button dismissed for 7 days");
    setShowPrompt(false);

    // บันทึกเวลาที่ dismiss ไว้ใน localStorage
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (error) {
      console.error("❌ [PWA Install] localStorage error:", error);
    }
  };

  // ไม่แสดงถ้า:
  // - กำลัง loading
  // - ติดตั้งแล้ว
  // - ไม่ installable
  // - dismiss ไปแล้ว
  if (isLoading || isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  return (
    <div className="relative">
      {/* Button with Icon + Text */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstallClick}
        className={cn(
          "relative group gap-2",
          "hover:bg-primary/5 transition-all duration-300"
        )}
        title="ติดตั้ง SUEKK App"
      >
        {/* Pulsing animation background */}
        <div className="absolute inset-0 rounded-md bg-primary/10 animate-pulse" />

        {/* Icon */}
        <Download className="h-4 w-4 relative z-10 text-primary transition-transform group-hover:scale-110" />

        {/* Text */}
        <span className="relative z-10 text-sm font-medium text-primary">
          ติดตั้งแอพ
        </span>

        {/* Badge indicator */}
        <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      </Button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={cn(
          "absolute -top-1 -right-1 z-30",
          "p-0.5 rounded-full bg-background border border-border shadow-sm",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-destructive/10 hover:border-destructive"
        )}
        title="ซ่อน"
      >
        <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
