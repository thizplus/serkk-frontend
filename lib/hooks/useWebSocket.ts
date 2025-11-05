// ============================================================================
// WebSocket Hook
// React hook สำหรับจัดการ WebSocket connection และ real-time updates
// ============================================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '@/lib/services/websocket.service';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Hook สำหรับจัดการ WebSocket connection
 * - Connect เมื่อ user login
 * - Disconnect เมื่อ user logout หรือ component unmount
 * - อัพเดท React Query cache เมื่อได้ real-time notifications
 */
export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();

  useEffect(() => {
    // ถ้าไม่มี token หรือไม่มี user → ไม่ต้อง connect
    if (!token || !user) {
      websocketService.disconnect();
      return;
    }

    // ถ้า connected อยู่แล้ว ไม่ต้อง connect ใหม่
    if (websocketService.isConnected()) {
      console.log('🔌 WebSocket already connected, skipping...');
      return;
    }

    // Connect WebSocket
    console.log('🔌 Initializing WebSocket connection...');
    websocketService.connect(token);

    // Subscribe to messages
    const unsubscribe = websocketService.onMessage((message) => {
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

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket...');
      unsubscribe();
      websocketService.disconnect();
    };
  }, [token, user, queryClient]);

  return {
    isConnected: websocketService.isConnected(),
  };
}
