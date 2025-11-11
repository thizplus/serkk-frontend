"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X, Sparkles, Rocket } from "@/shared/config/icons";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * UpdatePrompt Component
 *
 * แสดง notification เมื่อมี version ใหม่
 * ให้ user กด reload เพื่ออัปเดต
 *
 * Features:
 * - Auto-detect service worker updates
 * - Beautiful gradient design with animations
 * - Dismissable (แต่จะแสดงอีกครั้งใน 30 วินาที)
 * - ทำงานทั้ง Desktop, Mobile, PWA
 */
export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่า browser รองรับ Service Worker หรือไม่
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const checkForUpdates = () => {
      navigator.serviceWorker.ready.then((registration) => {
        // ตรวจสอบ update ทุกๆ 1 นาที
        setInterval(() => {
          registration.update();
        }, 60000); // 60 seconds
      });
    };

    const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            // มี SW เก่าทำงานอยู่ + มี SW ใหม่รอ = มี update!
            console.log("🔄 [Update] New version available!");
            setWaitingWorker(installingWorker);
            setShowPrompt(true);
          }
        }
      });
    };

    // ฟัง update events
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // ถ้ามี worker รออยู่แล้ว
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);
      }

      // ฟัง update event
      registration.addEventListener("updatefound", () => {
        handleUpdateFound(registration);
      });
    });

    // เช็ค update ทุกๆ 1 นาที
    checkForUpdates();

    // ฟังข้อความจาก Service Worker
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("🔄 [Update] Controller changed, reloading...");
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;

    setIsUpdating(true);

    // ส่งข้อความให้ SW activate ทันที
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Reload หน้าหลังจาก 500ms
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    setShowPrompt(false);

    // แสดง prompt อีกครั้งหลัง 30 วินาที
    setTimeout(() => {
      if (waitingWorker) {
        setShowPrompt(true);
      }
    }, 30000); // 30 seconds
  };

  if (!showPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md",
        "z-[60]", // สูงกว่า mobile bottom nav (z-50)
        "animate-in slide-in-from-bottom-5 fade-in duration-700"
      )}
    >
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 animate-pulse" />

        {/* Sparkle effect */}
        <div className="absolute top-2 right-2 animate-ping">
          <Sparkles className="h-3 w-3 text-primary/50" />
        </div>

        <div className="relative p-5">
          <div className="flex items-start gap-4">
            {/* Animated Icon */}
            <div className="shrink-0">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-md opacity-60 animate-pulse" />

                {/* Icon container */}
                <div className="relative p-3 bg-gradient-to-br from-primary to-purple-600 rounded-full shadow-lg">
                  {isUpdating ? (
                    <RefreshCw className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Rocket className="h-6 w-6 text-white animate-bounce" />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title with gradient */}
              <h3 className="font-bold text-base mb-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                เวอร์ชันใหม่มาแล้ว! ✨
              </h3>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                อัปเดต <span className="font-semibold text-foreground">SUEKK</span> เพื่อใช้งาน
                <span className="text-primary font-medium"> ฟีเจอร์ใหม่</span> และ
                <span className="text-green-500 font-medium"> แก้ไขบัค</span>
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className={cn(
                    "flex-1 font-semibold",
                    "bg-gradient-to-r from-primary via-purple-500 to-pink-500",
                    "hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      กำลังอัปเดต...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      อัปเดตเลย
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  ภายหลัง
                </Button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              disabled={isUpdating}
              className={cn(
                "shrink-0 p-1.5 rounded-full transition-all duration-200",
                "hover:bg-destructive/10 hover:text-destructive",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "active:scale-90"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress indicator */}
          {isUpdating && (
            <div className="mt-4 pt-3 border-t border-primary/10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 flex-1 bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full animate-pulse"
                       style={{ width: '100%' }} />
                </div>
                <span className="font-medium">โหลดใหม่...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
