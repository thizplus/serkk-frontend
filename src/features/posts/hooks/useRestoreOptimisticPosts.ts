"use client";

// ============================================================================
// Restore Optimistic Posts Hook (Phase 2)
// ============================================================================
//
// Purpose:
// - Restore optimistic posts from IndexedDB on page load
// - Resume incomplete uploads (Phase 2: ทำงานได้แล้ว!)
// - Clean up old/completed posts
//
// Usage:
// - Call once in root layout or provider
// - Runs on mount only (useEffect with empty deps)
//
// ============================================================================

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';
import {
  cleanupOldPosts,
  cleanupFailedPosts,
  getOptimisticPostsByStatus,
} from '@/shared/lib/storage/indexedDB';

/**
 * Hook to restore optimistic posts from IndexedDB on page load
 *
 * Runs once on mount to:
 * 1. Restore posts from IndexedDB
 * 2. Resume incomplete uploads (if any)
 * 3. Clean up old completed posts
 */
export function useRestoreOptimisticPosts() {
  const restoreFromIndexedDB = useOptimisticPostStore((state) => state.restoreFromIndexedDB);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // Run only once
    if (hasRestoredRef.current) {
      return;
    }

    hasRestoredRef.current = true;

    const restore = async () => {
      console.log('🔄 Starting optimistic posts restoration...');

      try {
        // ============================================================================
        // Step 1: Restore posts from IndexedDB
        // ============================================================================

        await restoreFromIndexedDB();

        // ============================================================================
        // Step 2: Clean up old posts
        // ============================================================================

        // Remove completed posts older than 1 hour
        const completedCount = await cleanupOldPosts(1);
        if (completedCount > 0) {
          console.log(`🧹 Cleaned up ${completedCount} old completed posts`);
        }

        // Remove failed posts older than 7 days
        const failedCount = await cleanupFailedPosts(7);
        if (failedCount > 0) {
          console.log(`🧹 Cleaned up ${failedCount} old failed posts`);
        }

        // ============================================================================
        // Step 3: Mark incomplete uploads as Failed (Phase 2)
        // ============================================================================

        console.log('🔄 Checking for incomplete uploads...');

        // Get all posts with status 'uploading' or 'creating_post'
        const uploadingPosts = await getOptimisticPostsByStatus('uploading');
        const creatingPosts = await getOptimisticPostsByStatus('creating_post');
        const incompletePosts = [...uploadingPosts, ...creatingPosts];

        if (incompletePosts.length > 0) {
          console.log(`📤 Found ${incompletePosts.length} incomplete posts`);

          // ✅ Mark all incomplete posts as "failed" so user can retry
          const store = useOptimisticPostStore.getState();

          incompletePosts.forEach((post) => {
            console.log(`⚠️ Marking post as failed (interrupted by page refresh): ${post.tempId}`);

            store.markPostFailed(
              post.tempId,
              'อัปโหลดถูกขัดจังหวะโดยการ refresh หน้า กรุณากด Retry เพื่อทำต่อ'
            );
          });

          // Show toast to notify user
          toast.info(`พบ ${incompletePosts.length} โพสต์ที่ยังอัปโหลดไม่เสร็จ`, {
            description: 'กด Retry เพื่ออัปโหลดใหม่',
            duration: 5000,
          });
        }

        console.log('✅ Optimistic posts restoration complete');
      } catch (error) {
        console.error('❌ Failed to restore optimistic posts:', error);
      }
    };

    restore();
  }, [restoreFromIndexedDB]);
}
