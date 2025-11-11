"use client";

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { uploadMultipleFiles } from '@/shared/lib/upload/concurrentUpload';
import postService from '@/features/posts/services/post.service';
import { postKeys } from './usePosts';
import { FORM_LIMITS } from '@/shared/config';

/**
 * Hook สำหรับจัดการ Optimistic Post Upload
 * - สร้าง temp post ทันที
 * - Upload media in background
 * - สร้าง real post เมื่อ upload เสร็จ
 * - Invalidate queries เพื่ออัปเดท UI
 */
export function useOptimisticPost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const addOptimisticPost = useOptimisticPostStore((state) => state.addOptimisticPost);
  const updateUploadProgress = useOptimisticPostStore((state) => state.updateUploadProgress);
  const markUploadComplete = useOptimisticPostStore((state) => state.markUploadComplete);
  const markUploadFailed = useOptimisticPostStore((state) => state.markUploadFailed);
  const markPostComplete = useOptimisticPostStore((state) => state.markPostComplete);
  const markPostFailed = useOptimisticPostStore((state) => state.markPostFailed);

  /**
   * สร้าง optimistic post และ upload in background
   */
  const createOptimisticPost = async (postData: {
    title: string;
    content: string;
    tags: string[];
    mediaFiles: {
      file: File;
      preview: string;
    }[];
  }) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบ');
      return null;
    }

    // 1. Create temp post
    const tempId = addOptimisticPost({
      title: postData.title,
      content: postData.content,
      tags: postData.tags,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      media: postData.mediaFiles,
    });

    // 2. Toast + Redirect immediately
    toast.success('กำลังโพสต์...');
    router.push('/');

    // 3. Upload in background (async, no await)
    uploadInBackground(tempId, postData);

    return tempId;
  };

  /**
   * Background upload function with concurrent uploads (p-limit)
   */
  const uploadInBackground = async (
    tempId: string,
    postData: {
      title: string;
      content: string;
      tags: string[];
      mediaFiles: { file: File; preview: string }[];
    }
  ) => {
    try {
      // Extract files
      const files = postData.mediaFiles.map(m => m.file);

      // Upload all files concurrently
      const uploadResult = await uploadMultipleFiles(files, {
        concurrency: FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS,
        onProgress: (progress) => {
          // Update individual file progress
          updateUploadProgress(tempId, progress.fileIndex, progress.progress);

          if (progress.status === 'completed') {
            markUploadComplete(
              tempId,
              progress.fileIndex,
              progress.mediaId!,
              progress.url!
            );
          } else if (progress.status === 'failed') {
            markUploadFailed(tempId, progress.fileIndex, progress.error || 'Upload failed');
          }
        },
        onError: (error, fileIndex) => {
          console.error(`Upload error for file ${fileIndex}:`, error);
        },
      });

      // Filter successful uploads
      const successfulUploads = uploadResult.results.filter(r => r.status === 'completed');

      if (successfulUploads.length === 0) {
        throw new Error('ไม่มีไฟล์ที่อัปโหลดสำเร็จ');
      }

      // Get media IDs
      const mediaIds = successfulUploads.map(r => r.mediaId!);

      // Show toast for partial success
      if (uploadResult.failedCount > 0) {
        toast.warning(
          `อัปโหลดสำเร็จ ${uploadResult.successCount}/${files.length} ไฟล์`
        );
      }

      // 4. Create real post via API
      const response = await postService.create({
        title: postData.title,
        content: postData.content,
        tags: postData.tags,
        mediaIds,
      });

      // 5. ✅ Invalidate React Query cache (เพื่อให้ feed/my-posts อัปเดท)
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        queryClient.invalidateQueries({ queryKey: postKeys.feed() });
        // ✅ Invalidate ทุก query ที่เริ่มต้นด้วย ['posts', 'author', userId] (partial match)
        queryClient.invalidateQueries({
          queryKey: ['posts', 'author', response.data.author.id]
        });
      }

      // 6. Mark post complete (temp post will be removed after 2s)
      markPostComplete(tempId);
      toast.success('โพสต์สำเร็จ!');
    } catch (error) {
      console.error('Post creation failed:', error);
      markPostFailed(tempId, 'การสร้างโพสต์ล้มเหลว');
      toast.error('การสร้างโพสต์ล้มเหลว');
    }
  };

  return {
    createOptimisticPost,
  };
}
