"use client";

// ============================================================================
// Post WebSocket Hook
// จัดการ WebSocket events สำหรับ posts และ update React Query cache
// ============================================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import notificationService from '@/lib/websocket/notification.service';
import { postKeys } from './usePosts';

/**
 * Hook สำหรับ listen post WebSocket events
 * และ update React Query cache อัตโนมัติ
 *
 * Events ที่ handle:
 * - post:new - โพสต์ใหม่ถูกสร้าง (จาก followers)
 * - post:updated - โพสต์ถูกแก้ไข
 * - post:deleted - โพสต์ถูกลบ
 */
export function usePostWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ============================================================================
    // Event: post:new
    // ============================================================================
    const unsubscribeNew = notificationService.on('post:new', (payload) => {
      console.log('📝 [WS] post:new received:', payload);

      // Invalidate all post lists to show new post
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    });

    // ============================================================================
    // Event: post:updated
    // ============================================================================
    const unsubscribeUpdated = notificationService.on('post:updated', (payload) => {
      console.log('✏️ [WS] post:updated received:', payload);

      const post = payload?.post;
      if (!post?.id) return;

      // Update specific post in cache
      queryClient.setQueryData(postKeys.detail(post.id), post);

      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    });

    // ============================================================================
    // Event: post:deleted
    // ============================================================================
    const unsubscribeDeleted = notificationService.on('post:deleted', (payload) => {
      console.log('🗑️ [WS] post:deleted received:', payload);

      const postId = payload?.postId;
      if (!postId) return;

      // Remove from cache
      queryClient.removeQueries({ queryKey: postKeys.detail(postId) });

      // Invalidate lists to remove deleted post
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [queryClient]);
}
