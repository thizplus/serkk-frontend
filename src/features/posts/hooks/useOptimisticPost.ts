"use client";

// ============================================================================
// Optimistic Post Hook (Phase 1, 2 & 3)
// Hook สำหรับจัดการ Optimistic Post Upload + Background Upload + Auto-Retry
// ============================================================================
//
// Flow:
// 1. User คลิก "Post" → สร้าง temp post ทันที (Optimistic UI)
// 2. Upload media files in background (concurrent upload with p-limit + auto-retry)
// 3. สร้าง real post via Backend API (ส่ง clientPostId + idempotencyKey)
// 4. Replace temp post ด้วย real post (auto-remove หลัง 2 วินาที)
// 5. Invalidate React Query cache เพื่ออัปเดท feed
//
// Phase 2 Features:
// - Auto-retry failed uploads (exponential backoff)
// - Retry failed posts (manual + automatic)
// - Resume uploads from IndexedDB
//
// ============================================================================

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { uploadMultipleFiles } from '@/lib/upload/concurrentUpload';
import { uploadWithRetry } from '@/shared/lib/upload/uploadWithRetry';
import { getFiles, saveFile, deleteFiles } from '@/shared/lib/storage/indexedDB';
import postService from '@/features/posts/services/post.service';
import { postKeys } from './usePosts';
import { FORM_LIMITS } from '@/config';

/**
 * Hook สำหรับจัดการ Optimistic Post Upload
 */
export function useOptimisticPost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // ============================================================================
  // Store Actions
  // ============================================================================

  const addOptimisticPost = useOptimisticPostStore((state) => state.addOptimisticPost);
  const updateUploadProgress = useOptimisticPostStore((state) => state.updateUploadProgress);
  const markMediaComplete = useOptimisticPostStore((state) => state.markMediaComplete);
  const markMediaFailed = useOptimisticPostStore((state) => state.markMediaFailed);
  const markPostCreating = useOptimisticPostStore((state) => state.markPostCreating);
  const markPostComplete = useOptimisticPostStore((state) => state.markPostComplete);
  const markPostFailed = useOptimisticPostStore((state) => state.markPostFailed);
  const retryFailedPost = useOptimisticPostStore((state) => state.retryFailedPost);
  const getOptimisticPost = useOptimisticPostStore((state) => state.getOptimisticPost);

  // ============================================================================
  // Main Function: Create Optimistic Post
  // ============================================================================

  /**
   * สร้าง optimistic post และ upload in background
   */
  const createOptimisticPost = async (postData: {
    title: string;
    content: string;
    tags: string[];
    mediaFiles?: {
      file?: File;
      preview: string;
    }[];
    mediaIds?: string[];  // ✅ NEW: ถ้ามี mediaIds แล้ว ไม่ต้อง upload ซ้ำ
    uploadPromise?: Promise<any> | null;  // ✅ NEW: Promise ของ Anticipatory Upload
  }) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบ');
      return null;
    }

    // ============================================================================
    // Step 0: Generate fileIds ONCE for all media files (prevent fileId mismatch)
    // ============================================================================

    console.log(`🔍 [DEBUG] postData.mediaFiles:`, postData.mediaFiles);

    const mediaWithFileIds = postData.mediaFiles?.map(m => {
      const mAny = m as any;
      console.log(`🔍 [DEBUG] mediaFile item:`, {
        hasFile: !!m.file,
        fileId: mAny.fileId,
        fileName: mAny.fileName,
        preview: m.preview?.substring(0, 50) + '...',
        allKeys: Object.keys(m),
      });

      const fileId = mAny.fileId || `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      return {
        ...m,
        fileId, // Store the generated fileId
      };
    });

    console.log(`🔍 [DEBUG] mediaWithFileIds:`, mediaWithFileIds?.map(m => ({
      hasFile: !!m.file,
      fileId: m.fileId,
    })));

    // ============================================================================
    // Step 1: Save files to IndexedDB FIRST (before creating temp post)
    // ============================================================================

    console.log(`📦 [FLOW] Step 1: Saving ${mediaWithFileIds?.length || 0} files to IndexedDB...`);

    if (mediaWithFileIds && mediaWithFileIds.length > 0) {
      try {
        for (const mediaFile of mediaWithFileIds) {
          if (mediaFile.file) {
            console.log(`💾 Saving file: ${mediaFile.fileId} (${mediaFile.file.name}, ${(mediaFile.file.size / 1024 / 1024).toFixed(2)}MB)`);

            await saveFile({
              fileId: mediaFile.fileId,
              name: mediaFile.file.name,
              type: mediaFile.file.type,
              size: mediaFile.file.size,
              blob: mediaFile.file,
              createdAt: new Date().toISOString(),
            });

            console.log(`✅ File saved to IndexedDB: ${mediaFile.fileId}`);
          } else {
            console.warn(`⚠️ mediaFile.file is undefined for fileId: ${mediaFile.fileId}`);
          }
        }
        console.log(`✅ [FLOW] Step 1 Complete: All files saved to IndexedDB`);
      } catch (error) {
        console.error('❌ Failed to save files to IndexedDB:', error);
        toast.error('ไม่สามารถบันทึกไฟล์ได้', {
          description: 'กรุณาลองใหม่อีกครั้ง',
        });
        return null;
      }
    } else {
      console.log(`ℹ️ [FLOW] Step 1: No files to save (creating post without media)`);
    }

    // ============================================================================
    // Step 2: Create Temp Post (Optimistic UI)
    // ============================================================================

    console.log(`📝 [FLOW] Step 2: Creating temp post...`);

    const { tempId, clientPostId, idempotencyKey } = addOptimisticPost({
      title: postData.title,
      content: postData.content,
      tags: postData.tags,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      media: mediaWithFileIds?.map(m => ({
        fileId: m.fileId, // Use the same fileId that was used to save the file
        fileName: m.file?.name || 'unknown',
        fileType: m.file?.type || 'application/octet-stream',
        fileSize: m.file?.size || 0,
        preview: m.preview,
      })) || [],
    });

    console.log(`✅ [FLOW] Step 2 Complete: Temp post created`, {
      tempId,
      clientPostId,
      fileIds: mediaWithFileIds?.map(m => m.fileId) || [],
    });

    // ============================================================================
    // Step 3: Redirect + Toast Immediately
    // ============================================================================

    console.log(`🚀 [FLOW] Step 3: Redirecting to feed...`);

    toast.success('กำลังโพสต์...', {
      description: postData.mediaIds
        ? 'กำลังสร้างโพสต์...'
        : 'ไฟล์กำลังอัปโหลดในพื้นหลัง',
    });
    router.push('/');

    console.log(`✅ [FLOW] Step 3 Complete: Redirected (background upload continues...)`);

    // ============================================================================
    // Step 4: Upload in background
    // ============================================================================

    console.log(`⚙️ [FLOW] Step 4: Starting background upload...`);

    // ============================================================================
    // Step 3: รอ Anticipatory Upload (ถ้ามี) แล้วใช้ mediaIds
    // ============================================================================

    // ✅ ถ้ามี uploadPromise → รอให้เสร็จก่อน (ใน background หลัง redirect)
    if (postData.uploadPromise) {
      console.log(`⏳ Waiting for Anticipatory Upload to finish (in background after redirect)...`);
      try {
        const uploadResult = await postData.uploadPromise;
        console.log(`✅ Anticipatory Upload finished!`, uploadResult);

        // ✅ ดึง mediaIds จาก upload result
        const successfulUploads = uploadResult.results.filter((r: any) => r.status === 'completed');
        const mediaIds = successfulUploads.map((r: any) => r.mediaId!);

        if (mediaIds.length > 0) {
          console.log(`✅ Using mediaIds from completed upload:`, mediaIds);
          createBackendPostDirectly(tempId, clientPostId, idempotencyKey, {
            title: postData.title,
            content: postData.content,
            tags: postData.tags,
            mediaIds,
          });
          return tempId;
        }
      } catch (error) {
        console.error(`❌ Anticipatory Upload failed:`, error);
        // Continue anyway - will try to create post without media or fail gracefully
      }
    }

    // ✅ ถ้ามี mediaIds อยู่แล้ว → ไม่ต้อง upload ซ้ำ
    if (postData.mediaIds && postData.mediaIds.length > 0) {
      console.log(`✅ Using existing mediaIds (no upload needed):`, postData.mediaIds);
      createBackendPostDirectly(tempId, clientPostId, idempotencyKey, {
        title: postData.title,
        content: postData.content,
        tags: postData.tags,
        mediaIds: postData.mediaIds,
      });
    }
    // ✅ ถ้าไม่มี mediaIds และมี mediaFiles → upload ปกติ (หรือผ่าน Service Worker)
    else if (postData.mediaFiles && postData.mediaFiles.some(f => f.file)) {
      console.log(`⚠️ No mediaIds - will upload files in background`);
      const mediaFilesWithFile = postData.mediaFiles.filter(f => f.file) as { file: File; preview: string; fileId: string }[];

      uploadInBackground(tempId, clientPostId, idempotencyKey, {
        title: postData.title,
        content: postData.content,
        tags: postData.tags,
        mediaFiles: mediaFilesWithFile,
      });
    }
    // ✅ ไม่มี media → สร้าง post เลย
    else {
      console.log(`📝 No media - creating post directly`);
      createBackendPostDirectly(tempId, clientPostId, idempotencyKey, {
        title: postData.title,
        content: postData.content,
        tags: postData.tags,
      });
    }

    return tempId;
  };

  // ============================================================================
  // Create Backend Post Directly (Skip Upload)
  // ============================================================================

  /**
   * สร้าง backend post โดยตรง (ไม่ต้อง upload เพราะมี mediaIds แล้ว)
   */
  const createBackendPostDirectly = async (
    tempId: string,
    clientPostId: string,
    idempotencyKey: string,
    postData: {
      title: string;
      content: string;
      tags: string[];
      mediaIds?: string[];
    }
  ) => {
    const POST_TIMEOUT = 30 * 1000; // 30 seconds

    try {
      console.log(`📝 Creating backend post (with existing mediaIds)...`);

      // Mark post as "creating"
      markPostCreating(tempId);

      const postTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('สร้างโพสต์ timeout')), POST_TIMEOUT);
      });

      const response = await Promise.race([
        postService.create({
          // Idempotency fields
          clientPostId,
          idempotencyKey,

          // Post content
          title: postData.title,
          content: postData.content,
          tags: postData.tags,
          mediaIds: postData.mediaIds,
        }),
        postTimeoutPromise,
      ]);

      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'สร้างโพสต์ล้มเหลว');
      }

      console.log(`✅ Backend post created:`, response.data!.id);

      // Invalidate React Query cache
      if (response.data) {
        queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        queryClient.invalidateQueries({ queryKey: postKeys.feed() });
        queryClient.invalidateQueries({
          queryKey: ['posts', 'author', response.data.author.id]
        });
      }

      // Mark post complete
      markPostComplete(tempId, response.data!.id);
      toast.success('โพสต์สำเร็จ!');

    } catch (error) {
      console.error('❌ Post creation failed:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'การสร้างโพสต์ล้มเหลว';

      markPostFailed(tempId, errorMessage);
      toast.error(errorMessage);
    }
  };

  // ============================================================================
  // Background Upload Function (Phase 2)
  // ============================================================================

  /**
   * Upload media files + Create backend post (ทำงานใน background)
   */
  const uploadInBackground = async (
    tempId: string,
    clientPostId: string,
    idempotencyKey: string,
    postData: {
      title: string;
      content: string;
      tags: string[];
      mediaFiles: { file: File; preview: string }[];
    }
  ) => {
    const UPLOAD_TIMEOUT = 10 * 60 * 1000; // 10 minutes (เพิ่มจาก 5 นาที)
    const POST_TIMEOUT = 30 * 1000; // 30 seconds

    try {
      // ============================================================================
      // Step A: Upload Media Files (Concurrent Upload)
      // ============================================================================

      const files = postData.mediaFiles.map(m => m.file);

      console.log(`🚀 Starting upload for ${files.length} files...`);

      const uploadTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout - ใช้เวลานานเกินไป')), UPLOAD_TIMEOUT);
      });

      // ============================================================================
      // ✅ Phase 2: Wrap upload with retry mechanism
      // ============================================================================

      const uploadResult = await Promise.race([
        uploadWithRetry(
          () => uploadMultipleFiles(files, {
            concurrency: FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS,
            onProgress: (progress) => {
              // Update individual file progress
              updateUploadProgress(tempId, progress.fileIndex, progress.progress);

              if (progress.status === 'completed') {
                markMediaComplete(
                  tempId,
                  progress.fileIndex,
                  progress.mediaId!,
                  progress.url!
                );
                console.log(`✅ File ${progress.fileIndex + 1} uploaded: ${progress.mediaId}`);
              } else if (progress.status === 'failed') {
                markMediaFailed(tempId, progress.fileIndex, progress.error || 'Upload failed');
                console.error(`❌ File ${progress.fileIndex + 1} failed:`, progress.error);
              }
            },
            onError: (error, fileIndex) => {
              console.error(`Upload error for file ${fileIndex}:`, error);
            },
          }),
          {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            onRetry: (error, attempt, delay) => {
              console.log(`⚠️ Upload retry ${attempt}/3 after ${delay}ms: ${error.message}`);
              toast.info(`กำลังลองอัปโหลดใหม่... (${attempt}/3)`, {
                duration: 2000,
              });
            },
          }
        ),
        uploadTimeoutPromise,
      ]);

      // ============================================================================
      // Step B: Validate Upload Result
      // ============================================================================

      if (!uploadResult || !uploadResult.results) {
        throw new Error('Upload ล้มเหลว - ไม่ได้รับผลลัพธ์');
      }

      // Filter successful uploads
      const successfulUploads = uploadResult.results.filter(r => r.status === 'completed');

      if (successfulUploads.length === 0) {
        throw new Error('ไม่มีไฟล์ที่อัปโหลดสำเร็จ');
      }

      // Get media IDs
      const mediaIds = successfulUploads.map(r => r.mediaId!);

      console.log(`✅ Upload complete: ${uploadResult.successCount}/${files.length} files`);

      // Show toast for partial success
      if (uploadResult.failedCount > 0) {
        toast.warning(
          `อัปโหลดสำเร็จ ${uploadResult.successCount}/${files.length} ไฟล์`,
          {
            description: `${uploadResult.failedCount} ไฟล์ล้มเหลว`,
          }
        );
      }

      // ============================================================================
      // Step C: Mark Post as "Creating" (All Media Uploaded)
      // ============================================================================

      markPostCreating(tempId);
      console.log(`📝 Creating backend post...`);

      // ============================================================================
      // Step D: Create Backend Post (with idempotency)
      // ============================================================================

      const postTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('สร้างโพสต์ timeout')), POST_TIMEOUT);
      });

      const response = await Promise.race([
        postService.create({
          // ✅ Idempotency fields
          clientPostId,
          idempotencyKey,

          // Post content
          title: postData.title,
          content: postData.content,
          tags: postData.tags,
          mediaIds,
        }),
        postTimeoutPromise,
      ]);

      // ============================================================================
      // Step E: Validate Backend Response
      // ============================================================================

      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'สร้างโพสต์ล้มเหลว');
      }

      console.log(`✅ Backend post created:`, response.data!.id);

      // ============================================================================
      // Step F: Invalidate React Query Cache
      // ============================================================================

      if (response.data) {
        queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        queryClient.invalidateQueries({ queryKey: postKeys.feed() });
        queryClient.invalidateQueries({
          queryKey: ['posts', 'author', response.data.author.id]
        });
      }

      // ============================================================================
      // Step G: Mark Post Complete (Auto-remove หลัง 2s)
      // ============================================================================

      markPostComplete(tempId, response.data!.id);
      toast.success('โพสต์สำเร็จ!');

    } catch (error) {
      console.error('❌ Post creation failed:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'การสร้างโพสต์ล้มเหลว';

      markPostFailed(tempId, errorMessage);
      toast.error(errorMessage, {
        description: 'โพสต์จะถูกเก็บไว้ คุณสามารถลองใหม่ได้',
      });
    }
  };

  // ============================================================================
  // Retry Failed Post (Phase 2: ทำงานได้แล้ว!)
  // ============================================================================

  /**
   * Retry failed post
   *
   * ✅ Phase 2: สามารถ retry ได้โดยดึง files จาก IndexedDB
   */
  const retryPost = async (tempId: string) => {
    const post = getOptimisticPost(tempId);

    if (!post) {
      toast.error('ไม่พบโพสต์ที่ต้องการลองใหม่');
      return;
    }

    if (post.status !== 'failed') {
      toast.warning('โพสต์นี้ยังไม่ล้มเหลว');
      return;
    }

    try {
      // ============================================================================
      // ✅ Phase 2: ดึง files จาก IndexedDB
      // ============================================================================

      // Get file IDs from post.media
      const fileIds = post.media.map(m => m.fileId);

      if (fileIds.length === 0) {
        // No media, just retry creating post
        console.log('📝 Retrying post creation (no media)...');

        await createBackendPostDirectly(
          tempId,
          post.clientPostId,
          post.idempotencyKey,
          {
            title: post.title,
            content: post.content,
            tags: post.tags,
          }
        );

        return;
      }

      // Load files from IndexedDB
      console.log(`🔄 [RETRY] Loading ${fileIds.length} files from IndexedDB...`);
      console.log(`🔄 [RETRY] File IDs to load:`, fileIds);

      const storedFiles = await getFiles(fileIds);

      console.log(`🔄 [RETRY] Found ${storedFiles.length} files in IndexedDB`);

      if (storedFiles.length === 0) {
        // ✅ Mark post as permanently failed (cannot retry without files)
        console.error(`❌ [RETRY] No files found! Expected ${fileIds.length} files but got 0`);

        markPostFailed(
          tempId,
          'FILES_NOT_FOUND: ไม่พบไฟล์ที่บันทึกไว้ กรุณาสร้างโพสต์ใหม่'
        );

        toast.error('ไม่พบไฟล์ที่บันทึกไว้', {
          description: 'กรุณาสร้างโพสต์ใหม่อีกครั้ง',
          duration: 5000,
        });
        return;
      }

      console.log(`✅ [RETRY] Successfully loaded files:`, storedFiles.map(f => ({
        fileId: f.fileId,
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(2)}MB`
      })));

      // Convert StoredFile[] to File[]
      const files = storedFiles.map((storedFile) => {
        return new File([storedFile.blob], storedFile.name, {
          type: storedFile.type,
        });
      });

      console.log(`✅ Loaded ${files.length} files from IndexedDB`);

      // Create blob URLs for preview
      const mediaFiles = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      // ============================================================================
      // Reset post status to 'uploading'
      // ============================================================================

      retryFailedPost(tempId);
      toast.info('กำลังลองอัปโหลดใหม่...');

      // ============================================================================
      // Retry upload in background
      // ============================================================================

      await uploadInBackground(
        tempId,
        post.clientPostId,
        post.idempotencyKey,
        {
          title: post.title,
          content: post.content,
          tags: post.tags,
          mediaFiles,
        }
      );

      // Cleanup blob URLs
      mediaFiles.forEach(m => URL.revokeObjectURL(m.preview));

    } catch (error) {
      console.error('❌ Retry failed:', error);
      toast.error('ไม่สามารถลองใหม่ได้', {
        description: error instanceof Error ? error.message : 'กรุณาลองใหม่อีกครั้ง',
      });
    }
  };

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    createOptimisticPost,
    retryPost,
  };
}
