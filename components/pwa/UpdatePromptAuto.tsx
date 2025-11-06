"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, Sparkles, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * UpdatePromptAuto Component
 *
 * Smart auto-update system with multiple strategies
 *
 * Strategies:
 * 1. 'idle' - Auto-reload after user is idle for X seconds (default: 30s)
 * 2. 'navigate' - Auto-reload when user navigates to a new page
 * 3. 'immediate' - Auto-reload immediately (not recommended)
 * 4. 'manual' - Show prompt and let user decide (default)
 */

type UpdateStrategy = "idle" | "navigate" | "immediate" | "manual";

interface UpdatePromptAutoProps {
  /**
   * Update strategy
   * @default 'navigate'
   */
  strategy?: UpdateStrategy;
  /**
   * Idle time in seconds before auto-reload (for 'idle' strategy)
   * @default 30
   */
  idleTimeout?: number;
  /**
   * Show countdown timer
   * @default true
   */
  showCountdown?: boolean;
}

export function UpdatePromptAuto({
  strategy = "navigate",
  idleTimeout = 30,
  showCountdown = true,
}: UpdatePromptAutoProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState(idleTimeout);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const pathname = usePathname();

  // === Service Worker Detection ===
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleUpdateFound = (registration: ServiceWorkerRegistration) => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            console.log("🆕 [Update] New version detected!");
            setWaitingWorker(installingWorker);
            setShowPrompt(true);

            // Strategy: Immediate
            if (strategy === "immediate") {
              console.log("⚡ [Update] Strategy: Immediate - Reloading now...");
              performUpdate(installingWorker);
            }
          }
        }
      });
    };

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);

        if (strategy === "immediate") {
          performUpdate(registration.waiting);
        }
      }

      registration.addEventListener("updatefound", () => {
        handleUpdateFound(registration);
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("🔄 [Update] Controller changed, reloading...");
      window.location.reload();
    });
  }, [strategy]);

  // === Strategy: Idle ===
  useEffect(() => {
    if (strategy !== "idle" || !showPrompt || !waitingWorker) return;

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];

    const handleActivity = () => {
      setLastActivity(Date.now());
      setCountdown(idleTimeout);
    };

    // Listen to user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Check idle status every second
    const interval = setInterval(() => {
      const timeSinceActivity = (Date.now() - lastActivity) / 1000;
      const remaining = Math.max(0, idleTimeout - Math.floor(timeSinceActivity));

      setCountdown(remaining);

      if (remaining === 0) {
        console.log("💤 [Update] User idle - Auto-updating...");
        performUpdate(waitingWorker);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [strategy, showPrompt, waitingWorker, lastActivity, idleTimeout]);

  // === Strategy: Navigate ===
  useEffect(() => {
    if (strategy !== "navigate" || !showPrompt || !waitingWorker) return;

    console.log("🧭 [Update] Strategy: Navigate - Will update on next navigation");

    // Auto-reload เมื่อเปลี่ยนหน้า
    performUpdate(waitingWorker);
  }, [pathname, strategy, showPrompt, waitingWorker]);

  // === Perform Update ===
  const performUpdate = (worker: ServiceWorker) => {
    setIsUpdating(true);
    worker.postMessage({ type: "SKIP_WAITING" });

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleManualUpdate = () => {
    if (!waitingWorker) return;
    console.log("👆 [Update] Manual update triggered");
    performUpdate(waitingWorker);
  };

  const handleDismiss = () => {
    setShowPrompt(false);

    // Show again after 30 seconds
    setTimeout(() => {
      if (waitingWorker) {
        setShowPrompt(true);
      }
    }, 30000);
  };

  // Don't show prompt for immediate/navigate strategies
  if (strategy === "immediate" || strategy === "navigate") {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md",
        "z-[60]",
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
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-md opacity-60 animate-pulse" />
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
              <h3 className="font-bold text-base mb-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                เวอร์ชันใหม่มาแล้ว! ✨
              </h3>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {strategy === "idle" && countdown > 0 ? (
                  <>
                    จะอัปเดตอัตโนมัติใน{" "}
                    <span className="font-bold text-primary text-lg">{countdown}</span> วินาที
                    <br />
                    <span className="text-xs">เคลื่อนเมาส์เพื่อยกเลิก</span>
                  </>
                ) : (
                  <>
                    อัปเดต <span className="font-semibold text-foreground">VOOBIZE</span> เพื่อใช้งาน
                    <span className="text-primary font-medium"> ฟีเจอร์ใหม่</span> และ
                    <span className="text-green-500 font-medium"> แก้ไขบัค</span>
                  </>
                )}
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleManualUpdate}
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
                "flex-shrink-0 p-1.5 rounded-full transition-all duration-200",
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
                  <div
                    className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  />
                </div>
                <span className="font-medium">โหลดใหม่...</span>
              </div>
            </div>
          )}

          {/* Idle countdown indicator */}
          {strategy === "idle" && countdown < idleTimeout && countdown > 0 && !isUpdating && (
            <div className="mt-4 pt-3 border-t border-primary/10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 flex-1 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / idleTimeout) * 100}%` }}
                  />
                </div>
                <span className="font-medium">{countdown}s</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
