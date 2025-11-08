// ============================================================================
// WebSocket Hook
// React hook สำหรับจัดการ WebSocket connection และ real-time updates
// ============================================================================

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '@/lib/services/websocket.service';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Hook สำหรับจัดการ WebSocket connection
 * - Connect เมื่อ user login
 * - Disconnect เฉพาะเมื่อ user logout (ไม่ disconnect เมื่อ navigate)
 * - อัพเดท React Query cache เมื่อได้ real-time notifications
 */
export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // ถ้าไม่มี token หรือไม่มี user → disconnect (user logout)
    if (!token || !user) {
      console.log('👋 User logged out, disconnecting WebSocket...');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      websocketService.disconnect();
      return;
    }

    // ถ้า connected อยู่แล้ว และ subscribed แล้ว → skip
    if (websocketService.isConnected() && unsubscribeRef.current) {
      console.log('🔌 WebSocket already connected and subscribed, skipping...');
      return;
    }

    // Connect WebSocket (ถ้ายัง)
    if (!websocketService.isConnected()) {
      console.log('🔌 Initializing WebSocket connection...');
      websocketService.connect(token);
    }

    // Subscribe to messages (ถ้ายัง)
    if (!unsubscribeRef.current) {
      console.log('📡 Subscribing to WebSocket messages...');
      unsubscribeRef.current = websocketService.onMessage((message) => {
        console.log('📨 Received WebSocket message:', message.type);

        switch (message.type) {
          case 'notification':
            // มี notification ใหม่ → อัพเดท unreadCount + invalidate queries
            console.log('🔔 New notification received');

            // อัพเดท unread count ใน cache
            queryClient.setQueryData(['notifications', 'unread-count'], message.data.unreadCount);

            // Invalidate notification lists เพื่อให้ refetch
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
            break;

          case 'notification_read':
            // มี notification ถูกอ่าน → อัพเดท unreadCount
            console.log('👁️ Notification marked as read');

            queryClient.setQueryData(['notifications', 'unread-count'], message.data.unreadCount);
            break;

          case 'notification_read_all':
            // อ่านทั้งหมด → อัพเดท unreadCount เป็น 0
            console.log('✅ All notifications marked as read');

            queryClient.setQueryData(['notifications', 'unread-count'], 0);
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
            break;

          default:
            console.warn('⚠️ Unknown WebSocket message type:', message.type);
        }
      });
    }

    // Cleanup: ไม่ disconnect เมื่อ component unmount (เพื่อป้องกันกระพริบเมื่อ navigate)
    // จะ disconnect เฉพาะเมื่อ logout (เข้า if block ด้านบน)
    return () => {
      console.log('🧹 useWebSocket cleanup (keeping connection alive)...');
      // Don't unsubscribe or disconnect on navigation
      // Only disconnect when user logs out (handled in the if block above)
    };
  }, [token, user, queryClient]);

  return {
    isConnected: websocketService.isConnected(),
  };
}
