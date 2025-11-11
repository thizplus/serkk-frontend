"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Bell } from "@/shared/config/icons";

/**
 * Test Push Notification Button
 * ปุ่มทดสอบแสดง notification โดยตรง (ไม่ผ่าน backend)
 */
export function TestPushButton() {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    setIsLoading(true);

    try {
      // Check if notification permission is granted
      if (Notification.permission !== "granted") {
        alert("กรุณาอนุญาตการแจ้งเตือนก่อน");
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Show test notification
      await registration.showNotification("🧪 ทดสอบ Push Notification", {
        body: "ถ้าเห็นข้อความนี้ แสดงว่า Push Notification ทำงานได้แล้ว!",
        icon: "/icon-white.svg",
        badge: "/icon-white.svg",
        tag: "test-" + Date.now(),
        data: {
          url: "/notifications",
          testId: Date.now(),
        },
        requireInteraction: false,
      });

      console.log("✅ Test notification sent successfully!");

      // Also log subscription info for debugging
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log("📋 Current subscription:");
        console.log({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
        });
      }
    } catch (error) {
      console.error("❌ Error sending test notification:", error);
      alert("เกิดข้อผิดพลาดในการส่งการแจ้งเตือนทดสอบ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={sendTestNotification}
      disabled={isLoading}
    >
      <Bell className="h-4 w-4 mr-2" />
      ทดสอบ Push
    </Button>
  );
}
