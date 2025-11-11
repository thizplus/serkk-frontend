"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from '@/features/auth';
import { useChatStore } from "@/features/chat/stores/chat";
import { getChatWebSocket, disconnectChatWebSocket } from "@/features/chat/services/chat";

/**
 * ChatProvider
 * Initializes and manages WebSocket connection for real-time chat
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { fetchConversations } = useChatStore();
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasConnectedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only connect WebSocket if user is authenticated
    if (isAuthenticated) {
      // ป้องกัน duplicate initialization
      if (hasInitializedRef.current) {
        console.log("⏭️ Chat already initialized, skipping...");
        return;
      }

      console.log("🚀 Initializing Chat (WebSocket + Data)...");
      hasInitializedRef.current = true;

      // 1. Fetch initial data (conversations with unread count)
      const initializeData = async () => {
        try {
          console.log("📊 Fetching conversations...");
          await fetchConversations(); // ✅ unreadCount คำนวณจาก conversations แล้ว
          console.log("✅ Chat data initialized");
        } catch (error) {
          console.error("❌ Failed to initialize chat data:", error);
        }
      };

      initializeData();

      // 2. Connect WebSocket
      // ป้องกัน duplicate connection
      if (hasConnectedRef.current) {
        console.log("⏭️ Chat WebSocket already connected, skipping...");
        return;
      }

      hasConnectedRef.current = true;

      // Get WebSocket instance
      const ws = getChatWebSocket();

      // ตรวจสอบว่า WebSocket connect อยู่แล้วหรือไม่
      if (ws.isConnected()) {
        console.log("✅ Chat WebSocket already connected");
        return;
      }

      // เชื่อมต่อทันที (ไม่ต้อง setTimeout เพราะ auth token พร้อมแล้ว)
      connectTimeoutRef.current = setTimeout(() => {
        console.log("🔌 Connecting Chat WebSocket...");
        ws.connect();
      }, 100); // Delay เล็กน้อยเพื่อให้ auth store พร้อม

      // Cleanup function
      return () => {
        console.log("🧹 ChatProvider cleanup...");

        // Clear timeout ถ้ายังไม่ทำงาน
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }

        // Don't disconnect on component unmount (for React Strict Mode)
        // Only disconnect when user logs out (in else block below)
      };
    } else {
      // Disconnect WebSocket when user logs out
      console.log("👋 User logged out, disconnecting Chat WebSocket...");
      hasConnectedRef.current = false;
      hasInitializedRef.current = false;
      disconnectChatWebSocket();
    }
  }, [isAuthenticated, fetchConversations]);

  return <>{children}</>;
}
