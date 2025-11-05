"use client";

import { useEffect, useState } from "react";

/**
 * PWA Installer Component
 * - Registers service worker
 * - Handles PWA installation
 * - Manages service worker lifecycle
 */
export function PWAInstaller() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("[PWA] Service Workers not supported");
      return;
    }

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        });

        console.log("[PWA] Service Worker registered successfully:", reg.scope);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[PWA] New Service Worker available");
              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates every hour
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();

    // Handle controller change (new service worker activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[PWA] Service Worker controller changed");
      // Optionally reload the page
      // window.location.reload();
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update service worker when new version available
  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    // Tell the waiting service worker to take over
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Reload page after service worker activates
    window.location.reload();
  };

  // Show update notification (optional)
  if (updateAvailable) {
    console.log("[PWA] Update available - you can show a toast notification here");
    // You can use your toast library here:
    // toast.info("New version available! Click to update.", { onClick: handleUpdate });
  }

  // This component doesn't render anything
  return null;
}
