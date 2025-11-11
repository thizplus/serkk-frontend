"use client";

import { useEffect, useState } from "react";
import { Bell } from "@/shared/config/icons";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { useAuthStore } from '@/features/auth';
import { pushService } from "../services/push.service";

/**
 * Push Notification Component
 * - Request notification permission
 * - Subscribe/Unsubscribe to push notifications
 * - Send subscription to backend
 */
export function PushNotification() {
  const { token } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Debug: Log auth state
    console.log("[Push] Component mounted, token:", !!token);
  }, [token]);

  useEffect(() => {
    // Check if Push API is supported
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  // Check if already subscribed
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("[Push] Error checking subscription:", error);
    }
  };

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported) {
      alert("Push notifications ไม่รองรับในเบราว์เซอร์นี้");
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        alert("กรุณาอนุญาตการแจ้งเตือนเพื่อรับการแจ้งเตือน");
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        // Fetch from backend if not in env
        try {
          vapidPublicKey = await pushService.getPublicKey();
        } catch (error) {
          console.error("[Push] Failed to fetch public key from backend:", error);
          alert("ไม่สามารถดึง public key ได้");
          setIsLoading(false);
          return;
        }
      }

      // Subscribe to push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("[Push] Subscription successful:", subscription);

      // Send subscription to backend
      try {
        await sendSubscriptionToBackend(subscription);
        setIsSubscribed(true);
      } catch (backendError) {
        console.error("[Push] Failed to save subscription to backend:", backendError);

        // Unsubscribe locally if backend fails
        await subscription.unsubscribe();

        const errorMessage = backendError instanceof Error
          ? backendError.message
          : "ไม่สามารถบันทึกการแจ้งเตือนได้";

        alert(`เกิดข้อผิดพลาด: ${errorMessage}\n\nกรุณาตรวจสอบว่าคุณ login แล้ว`);
      }
    } catch (error) {
      console.error("[Push] Subscription failed:", error);
      alert("เกิดข้อผิดพลาดในการสมัครรับการแจ้งเตือน");
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from backend
        await removeSubscriptionFromBackend(subscription);

        setIsSubscribed(false);
        console.log("[Push] Unsubscribed successfully");
      }
    } catch (error) {
      console.error("[Push] Unsubscribe failed:", error);
      alert("เกิดข้อผิดพลาดในการยกเลิกการแจ้งเตือน");
    } finally {
      setIsLoading(false);
    }
  };

  // Send subscription to backend
  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      console.log("[Push] Sending subscription to backend...");
      const response = await pushService.subscribe(subscription);
      console.log("[Push] Subscription sent successfully:", response);
    } catch (error) {
      console.error("[Push] Error sending subscription to backend:", error);
      throw error; // Re-throw to handle in subscribe()
    }
  };

  // Remove subscription from backend
  const removeSubscriptionFromBackend = async (subscription: PushSubscription) => {
    try {
      if (!token) {
        console.warn("[Push] No token for unsubscribe - skipping backend call");
        return;
      }

      console.log("[Push] Removing subscription from backend...");
      const response = await pushService.unsubscribe(subscription);
      console.log("[Push] Subscription removed successfully:", response);
    } catch (error) {
      console.error("[Push] Error removing subscription from backend:", error);
      // Don't throw - local unsubscribe should still work
    }
  };

  // Don't render if not supported or not logged in
  if (!isSupported || !token) {
    return null;
  }

  // Handle switch toggle
  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Bell className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <Switch
          id="push-notifications"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading || permission === "denied"}
        />
        <Label
          htmlFor="push-notifications"
          className="text-sm font-medium cursor-pointer"
        >
          {permission === "denied"
            ? "การแจ้งเตือนถูกปฏิเสธ"
            : "การแจ้งเตือน"}
        </Label>
        {isLoading && (
          <span className="text-xs text-muted-foreground">กำลังโหลด...</span>
        )}
      </div>
    </div>
  );
}
