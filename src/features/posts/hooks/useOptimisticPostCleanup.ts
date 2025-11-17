"use client"

import { useEffect } from 'react';
import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';

/**
 * Hook สำหรับ cleanup optimistic posts ที่ค้างใน localStorage
 *
 * ✅ Auto-cleanup เมื่อ:
 * - Posts เก่ากว่า 10 นาที (posts ที่ค้างนาน)
 * - Posts ที่ completed (ลบทันทีเพราะ real post มาแทนแล้ว)
 * - Posts ที่ failed (ไม่ auto-cleanup - ให้ user กด retry หรือลบเอง)
 */
export function useOptimisticPostCleanup() {
  const clearOldPosts = useOptimisticPostStore((state) => state.clearOldPosts);
  const clearCompletedPosts = useOptimisticPostStore((state) => state.clearCompletedPosts);

  useEffect(() => {
    // ✅ Cleanup เมื่อ app load
    clearOldPosts();        // ลบ posts ที่เก่ากว่า 10 นาที
    clearCompletedPosts();  // ลบ posts ที่ completed (shouldn't exist, but just in case)

    // ❌ ไม่ auto-cleanup failed posts - ให้ user กด retry หรือลบเอง

    // ✅ Periodic cleanup ทุก 1 นาที
    const periodicCleanupInterval = setInterval(() => {
      clearOldPosts();
      clearCompletedPosts();
    }, 1 * 60 * 1000); // 1 minute

    return () => {
      clearInterval(periodicCleanupInterval);
    };
  }, [clearOldPosts, clearCompletedPosts]);
}
