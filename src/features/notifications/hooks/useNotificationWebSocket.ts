"use client";

// ============================================================================
// Notification WebSocket Hook
// จัดการ WebSocket events สำหรับ notifications และ update React Query cache
// ============================================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import notificationService from '@/lib/websocket/notification.service';
import { notificationKeys } from './useNotifications';

/**
 * Hook สำหรับ listen notification WebSocket events
 * และ update React Query cache อัตโนมัติ
 *
 * Events ที่ handle:
 * - notification:new - notification ใหม่เข้ามา
 * - notification:read - notification ถูกอ่าน
 * - notification:read_all - อ่านทั้งหมดแล้ว
 * - notification:count_updated - จำนวน unread เปลี่ยน
 */
export function useNotificationWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ============================================================================
    // Event: notification:new
    // ============================================================================
    const unsubscribeNew = notificationService.on('notification:new', (payload) => {
      console.log('📬 [WS] notification:new received:', payload);

      // Invalidate notification lists to refetch
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    });

    // ============================================================================
    // Event: notification:read
    // ============================================================================
    const unsubscribeRead = notificationService.on('notification:read', (payload) => {
      console.log('👁️ [WS] notification:read received:', payload);

      // Invalidate notification lists
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    });

    // ============================================================================
    // Event: notification:read_all
    // ============================================================================
    const unsubscribeReadAll = notificationService.on('notification:read_all', (payload) => {
      console.log('✅ [WS] notification:read_all received:', payload);

      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    // ============================================================================
    // Event: notification:count_updated
    // ============================================================================
    const unsubscribeCount = notificationService.on('notification:count_updated', (payload) => {
      console.log('🔢 [WS] notification:count_updated received:', payload);

      // Update unread count in cache directly
      if (typeof payload?.unreadCount === 'number') {
        queryClient.setQueryData(notificationKeys.unreadCount(), payload.unreadCount);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeReadAll();
      unsubscribeCount();
    };
  }, [queryClient]);
}
