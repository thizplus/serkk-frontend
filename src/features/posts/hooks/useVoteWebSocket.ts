"use client";

// ============================================================================
// Vote WebSocket Hook
// จัดการ WebSocket events สำหรับ votes และ update React Query cache
// ============================================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import notificationService from '@/lib/websocket/notification.service';
import { postKeys } from './usePosts';
import type { Post } from '@/types/models';

/**
 * Hook สำหรับ listen vote WebSocket events
 * และ update React Query cache อัตโนมัติ
 *
 * Events ที่ handle:
 * - vote:updated - vote count เปลี่ยน (posts และ comments)
 */
export function useVoteWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ============================================================================
    // Event: vote:updated
    // ============================================================================
    const unsubscribeVote = notificationService.on('vote:updated', (payload) => {
      console.log('👍 [WS] vote:updated received:', payload);

      const { targetId, targetType, voteCount } = payload || {};
      if (!targetId || !targetType) return;

      // Update vote count based on target type
      if (targetType === 'post') {
        // Update post vote count in cache
        queryClient.setQueryData<Post>(postKeys.detail(targetId), (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            votes: voteCount,
          };
        });

        // Invalidate lists to update vote count in feeds
        queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        queryClient.invalidateQueries({ queryKey: postKeys.feed() });
      } else if (targetType === 'comment') {
        // For comments, we need to invalidate the post detail
        // since comments are nested inside posts
        // Note: We don't have the post ID here, so we invalidate all post details
        queryClient.invalidateQueries({ queryKey: postKeys.details() });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeVote();
    };
  }, [queryClient]);
}
