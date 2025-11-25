"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth";
import notificationService from "@/lib/websocket/notification.service";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationWebSocket } from "@/features/notifications/hooks/useNotificationWebSocket";
import { usePostWebSocket } from "@/features/posts/hooks/usePostWebSocket";
import { useVoteWebSocket } from "@/features/posts/hooks/useVoteWebSocket";

/**
 * Notification Provider
 *
 * Handles global WebSocket notification events:
 * - post:auto_published - When draft post auto-publishes after video encoding
 * - video:encoding:completed - When video encoding completes
 * - video:encoding:failed - When video encoding fails
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // ✅ Enable WebSocket event listeners for real-time updates
  useNotificationWebSocket();
  usePostWebSocket();
  useVoteWebSocket();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !token) {
      return;
    }

    // Connect to notification WebSocket
    console.log("🔔 Connecting to notification WebSocket...");
    notificationService.connect(token);

    // Handle post auto-publish event
    const handleAutoPublish = (data: any) => {
      console.log("🎉 Post auto-published:", data);

      // Invalidate posts queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      // Show toast notification with action
      toast.success(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">โพสต์ของคุณเผยแพร่แล้ว! 🎉</p>
          <p className="text-sm text-muted-foreground">
            วิดีโอประมวลผลเสร็จแล้ว โพสต์พร้อมให้ทุกคนดูแล้ว
          </p>
        </div>,
        {
          duration: 10000,
          action: {
            label: "ดูโพสต์",
            onClick: () => router.push(`/post/${data.postId}`),
          },
        }
      );

    

      // Optional: Play notification sound
      if (typeof Audio !== "undefined") {
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignore autoplay errors
          });
        } catch (error) {
          // Ignore audio errors
        }
      }
    };

    // Subscribe to both colon and dot notation
    const unsubAutoPublish = notificationService.on("post:auto_published", handleAutoPublish);
    const unsubAutoPublishLegacy = notificationService.on("post.auto_published", handleAutoPublish);

    // Handle video encoding completed (for non-post videos)
    const unsubVideoCompleted = notificationService.on("video:encoding:completed", (data: any) => {
      console.log("✅ Video encoding completed:", data);

      // Invalidate media queries
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    });

    // Handle video encoding failed
    const unsubVideoFailed = notificationService.on("video:encoding:failed", (data: any) => {
      console.log("❌ Video encoding failed:", data);

      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">ประมวลผลวิดีโอล้มเหลว</p>
          <p className="text-sm text-muted-foreground">
            กรุณาลองอัปโหลดวิดีโอใหม่อีกครั้ง
          </p>
        </div>,
        { duration: 8000 }
      );
    });

    // Cleanup on unmount or auth change
    return () => {
      console.log("🔌 Disconnecting notification WebSocket...");
      unsubAutoPublish();
      unsubAutoPublishLegacy();
      unsubVideoCompleted();
      unsubVideoFailed();
      notificationService.disconnect();
    };
  }, [isAuthenticated, token, router, queryClient]);

  return <>{children}</>;
}
