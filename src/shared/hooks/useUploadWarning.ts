'use client';

import { useEffect } from 'react';
import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';

/**
 * แสดง warning ก่อนปิด browser ถ้ามี posts ที่กำลัง upload
 *
 * Usage:
 * - เรียกใน Root Layout เพื่อ enable warning ทั้ง app
 * - Warning จะแสดงเฉพาะเมื่อมี optimistic posts ที่ status = 'uploading'
 */
export function useUploadWarning() {
  const hasUploadingPosts = useOptimisticPostStore((state) => state.hasUploadingPosts);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUploadingPosts()) {
        // Standard way to show browser confirmation dialog
        e.preventDefault();

        // Chrome requires returnValue to be set
        e.returnValue = 'คุณมีโพสต์ที่กำลังอัปโหลดอยู่ หากปิดเบราว์เซอร์จะยกเลิกการอัปโหลด';

        // For older browsers
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUploadingPosts]);
}
