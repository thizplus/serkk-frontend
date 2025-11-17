// ============================================================================
// Optimistic Post Store (Phase 2)
// Zustand store สำหรับจัดการ Temporary Posts ที่กำลัง upload
// ============================================================================
//
// Features:
// - ✅ Create temp post immediately (Optimistic UI)
// - ✅ Track upload progress for each file
// - ✅ Track backend post creation status
// - ✅ Idempotency support (clientPostId + idempotencyKey)
// - ✅ Auto-cleanup completed posts
// - ✅ Retry failed uploads
// - ✅ Phase 2: IndexedDB persistence (survive F5 refresh)
// - ✅ Phase 2: Restore upload queue on page load
//
// Architecture:
// - Zustand = In-memory state (source of truth for UI)
// - IndexedDB = Persistent storage (survive refresh)
// - Sync on every state change
//
// ============================================================================

import { create } from 'zustand';
import {
  saveOptimisticPost,
  updateOptimisticPost as updateOptimisticPostDB,
  deleteOptimisticPost as deleteOptimisticPostDB,
  getAllOptimisticPosts,
  isIndexedDBSupported,
  deleteFiles,
} from '@/shared/lib/storage/indexedDB';
import type { StoredOptimisticPost } from '@/shared/lib/storage/indexedDB';

/**
 * Optimistic Post Structure
 */
export interface OptimisticPost {
  // ============================================================================
  // Identity & Idempotency
  // ============================================================================
  tempId: string;           // Temporary ID (UUID) สำหรับ frontend
  clientPostId: string;     // Client Post ID สำหรับ backend idempotency
  idempotencyKey: string;   // Idempotency key สำหรับ backend
  realPostId?: string;      // Real post ID จาก backend (เมื่อสร้างสำเร็จ)

  // ============================================================================
  // Post Content
  // ============================================================================
  title: string;
  content: string;
  tags: string[];

  // ============================================================================
  // Author Info
  // ============================================================================
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };

  // ============================================================================
  // Media Upload Tracking
  // ============================================================================
  media: {
    // File metadata (for IndexedDB persistence)
    fileId: string;                 // Unique ID for the file
    fileName: string;               // Original file name
    fileType: string;               // MIME type
    fileSize: number;               // File size in bytes

    // Preview (blob URL - only valid in current session)
    preview: string;                // blob URL for preview

    // Upload tracking
    uploadProgress: number;         // 0-100
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';

    // Backend response
    mediaId?: string;               // Media ID from backend (confirmUpload)
    url?: string;                   // R2 public URL
    error?: string;                 // Error message (if failed)
  }[];

  // ============================================================================
  // Overall Status
  // ============================================================================
  status: 'uploading' | 'creating_post' | 'completed' | 'failed';
  error?: string;                   // Post-level error message

  // ============================================================================
  // Timestamps
  // ============================================================================
  createdAt: string;                // ISO string
  updatedAt: string;                // ISO string
}

/**
 * Store State & Actions
 */
interface OptimisticPostState {
  optimisticPosts: OptimisticPost[];

  // ============================================================================
  // Post Management
  // ============================================================================

  /**
   * Create new optimistic post
   * @returns tempId
   */
  addOptimisticPost: (post: {
    title: string;
    content: string;
    tags: string[];
    author: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
    };
    media: {
      fileId: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      preview: string;
    }[];
  }) => {
    tempId: string;
    clientPostId: string;
    idempotencyKey: string;
  };

  /**
   * Remove optimistic post from store
   */
  removeOptimisticPost: (tempId: string) => void;

  /**
   * Clear all completed posts
   */
  clearCompletedPosts: () => void;

  /**
   * Clear all failed posts
   */
  clearFailedPosts: () => void;

  /**
   * Clear posts older than 10 minutes
   */
  clearOldPosts: () => void;

  // ============================================================================
  // Upload Progress Tracking
  // ============================================================================

  /**
   * Update upload progress for specific media
   */
  updateUploadProgress: (tempId: string, mediaIndex: number, progress: number) => void;

  /**
   * Mark media upload as completed
   */
  markMediaComplete: (
    tempId: string,
    mediaIndex: number,
    mediaId: string,
    url: string
  ) => void;

  /**
   * Mark media upload as failed
   */
  markMediaFailed: (tempId: string, mediaIndex: number, error: string) => void;

  // ============================================================================
  // Post Status Updates
  // ============================================================================

  /**
   * Mark post as "creating_post" (all media uploaded, creating backend post)
   */
  markPostCreating: (tempId: string) => void;

  /**
   * Mark post as completed (backend post created successfully)
   */
  markPostComplete: (tempId: string, realPostId: string) => void;

  /**
   * Mark post as failed
   */
  markPostFailed: (tempId: string, error: string) => void;

  // ============================================================================
  // Retry & Recovery
  // ============================================================================

  /**
   * Retry failed post (reset to uploading)
   */
  retryFailedPost: (tempId: string) => void;

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Check if there are any posts currently uploading
   */
  hasUploadingPosts: () => boolean;

  /**
   * Get optimistic post by tempId
   */
  getOptimisticPost: (tempId: string) => OptimisticPost | undefined;

  // ============================================================================
  // Phase 2: IndexedDB Persistence
  // ============================================================================

  /**
   * Restore optimistic posts from IndexedDB (on page load)
   */
  restoreFromIndexedDB: () => Promise<void>;

  /**
   * Manually sync current state to IndexedDB
   */
  syncToIndexedDB: () => Promise<void>;
}

/**
 * Generate unique IDs
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateClientPostId(): string {
  return `client_post_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Helper Functions: Convert between In-Memory and IndexedDB formats
// ============================================================================

/**
 * Convert in-memory OptimisticPost to IndexedDB StoredOptimisticPost
 * (Removes blob URLs, keeps only metadata)
 */
function toStoredPost(post: OptimisticPost): StoredOptimisticPost {
  return {
    ...post,
    media: post.media.map((m) => ({
      fileId: m.fileId,
      fileName: m.fileName,
      fileType: m.fileType,
      fileSize: m.fileSize,
      preview: m.preview, // Keep preview for now (will regenerate if needed)
      status: m.uploadStatus,
      progress: m.uploadProgress,
      mediaId: m.mediaId,
      url: m.url,
      error: m.error,
    })),
  };
}

/**
 * Convert IndexedDB StoredOptimisticPost to in-memory OptimisticPost
 * (Restores structure, keeps existing previews)
 */
function fromStoredPost(stored: StoredOptimisticPost): OptimisticPost {
  return {
    ...stored,
    media: stored.media.map((m) => ({
      fileId: m.fileId,
      fileName: m.fileName,
      fileType: m.fileType,
      fileSize: m.fileSize,
      preview: m.preview,
      uploadProgress: m.progress,
      uploadStatus: m.status,
      mediaId: m.mediaId,
      url: m.url,
      error: m.error,
    })),
    // Fix status mapping
    status: stored.status as 'uploading' | 'creating_post' | 'completed' | 'failed',
  };
}

/**
 * Sync a single post to IndexedDB (helper)
 */
async function syncPostToIndexedDB(post: OptimisticPost): Promise<void> {
  if (!isIndexedDBSupported()) {
    console.warn('⚠️ IndexedDB not supported - skipping sync');
    return;
  }

  try {
    const storedPost = toStoredPost(post);
    await saveOptimisticPost(storedPost);
  } catch (error) {
    console.error('❌ Failed to sync post to IndexedDB:', error);
  }
}

/**
 * Zustand Store (Phase 2: with IndexedDB persistence)
 */
export const useOptimisticPostStore = create<OptimisticPostState>((set, get) => ({
  optimisticPosts: [],

  // ============================================================================
  // Post Management
  // ============================================================================

  addOptimisticPost: (postData) => {
    const tempId = generateTempId();
    const clientPostId = generateClientPostId();
    const idempotencyKey = generateIdempotencyKey();

    const now = new Date().toISOString();

    const optimisticPost: OptimisticPost = {
      // Identity
      tempId,
      clientPostId,
      idempotencyKey,

      // Content
      title: postData.title,
      content: postData.content,
      tags: postData.tags,

      // Author
      author: postData.author,

      // Media (with file metadata for persistence)
      media: postData.media.map((m) => ({
        fileId: m.fileId,
        fileName: m.fileName,
        fileType: m.fileType,
        fileSize: m.fileSize,
        preview: m.preview,
        uploadProgress: 0,
        uploadStatus: 'pending' as const,
      })),

      // Status
      status: 'uploading',

      // Timestamps
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      optimisticPosts: [optimisticPost, ...state.optimisticPosts],
    }));

    // ✅ Phase 2: Sync to IndexedDB
    syncPostToIndexedDB(optimisticPost);

    return { tempId, clientPostId, idempotencyKey };
  },

  removeOptimisticPost: (tempId) => {
    // ✅ Phase 2: Get post before removing to extract fileIds
    const post = get().getOptimisticPost(tempId);
    const fileIds = post?.media.map(m => m.fileId) || [];

    console.log(`🗑️ [CLEANUP] Removing optimistic post: ${tempId}`);
    console.log(`🗑️ [CLEANUP] Associated files to delete:`, fileIds);

    set((state) => ({
      optimisticPosts: state.optimisticPosts.filter((post) => post.tempId !== tempId),
    }));

    // ✅ Phase 2: Delete from IndexedDB (both post and files)
    if (isIndexedDBSupported()) {
      // Delete post
      deleteOptimisticPostDB(tempId).catch((error) => {
        console.error('❌ Failed to delete post from IndexedDB:', error);
      });

      // Delete files (if any)
      if (fileIds.length > 0) {
        console.log(`🧹 [CLEANUP] Deleting ${fileIds.length} files from IndexedDB...`);
        deleteFiles(fileIds)
          .then(() => {
            console.log(`✅ [CLEANUP] Successfully deleted ${fileIds.length} files from IndexedDB`);
          })
          .catch((error) => {
            console.error('❌ [CLEANUP] Failed to delete files from IndexedDB:', error);
          });
      } else {
        console.log(`ℹ️ [CLEANUP] No files to delete`);
      }
    }
  },

  clearCompletedPosts: () => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.filter((post) => post.status !== 'completed'),
    }));
  },

  clearFailedPosts: () => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.filter((post) => post.status !== 'failed'),
    }));
  },

  clearOldPosts: () => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    set((state) => ({
      optimisticPosts: state.optimisticPosts.filter((post) => {
        const postAge = now - new Date(post.createdAt).getTime();
        return postAge < maxAge;
      }),
    }));
  },

  // ============================================================================
  // Upload Progress Tracking
  // ============================================================================

  updateUploadProgress: (tempId, mediaIndex, progress) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              media: post.media.map((m, i) =>
                i === mediaIndex
                  ? {
                      ...m,
                      uploadProgress: progress,
                      uploadStatus: 'uploading' as const,
                    }
                  : m
              ),
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));

    // ✅ Phase 2: Sync to IndexedDB
    const updatedPost = get().getOptimisticPost(tempId);
    if (updatedPost) {
      syncPostToIndexedDB(updatedPost);
    }
  },

  markMediaComplete: (tempId, mediaIndex, mediaId, url) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              media: post.media.map((m, i) =>
                i === mediaIndex
                  ? {
                      ...m,
                      uploadProgress: 100,
                      uploadStatus: 'completed' as const,
                      mediaId,
                      url,
                    }
                  : m
              ),
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));

    // ✅ Phase 2: Sync to IndexedDB
    const updatedPost = get().getOptimisticPost(tempId);
    if (updatedPost) {
      syncPostToIndexedDB(updatedPost);
    }
  },

  markMediaFailed: (tempId, mediaIndex, error) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              media: post.media.map((m, i) =>
                i === mediaIndex
                  ? {
                      ...m,
                      uploadStatus: 'failed' as const,
                      error,
                    }
                  : m
              ),
              status: 'failed' as const,
              error: `Failed to upload file: ${error}`,
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));

    // ✅ Phase 2: Sync to IndexedDB
    const updatedPost = get().getOptimisticPost(tempId);
    if (updatedPost) {
      syncPostToIndexedDB(updatedPost);
    }
  },

  // ============================================================================
  // Post Status Updates
  // ============================================================================

  markPostCreating: (tempId) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              status: 'creating_post' as const,
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));

    // ✅ Phase 2: Sync to IndexedDB
    const updatedPost = get().getOptimisticPost(tempId);
    if (updatedPost) {
      syncPostToIndexedDB(updatedPost);
    }
  },

  markPostComplete: (tempId, realPostId) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              realPostId,
              status: 'completed' as const,
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));

    // ✅ Phase 2: Sync to IndexedDB before auto-removal
    const updatedPost = get().getOptimisticPost(tempId);
    if (updatedPost) {
      syncPostToIndexedDB(updatedPost);
    }

    // Auto-remove หลัง 2 วินาที (เพื่อให้ real post จาก API มาแทนที่)
    // Note: This will also remove from IndexedDB via removeOptimisticPost
    setTimeout(() => {
      get().removeOptimisticPost(tempId);
    }, 2000);
  },

  markPostFailed: (tempId, error) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              status: 'failed' as const,
              error,
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));

    // ✅ Phase 2: Sync to IndexedDB
    const updatedPost = get().getOptimisticPost(tempId);
    if (updatedPost) {
      syncPostToIndexedDB(updatedPost);
    }
  },

  // ============================================================================
  // Retry & Recovery
  // ============================================================================

  retryFailedPost: (tempId) => {
    set((state) => ({
      optimisticPosts: state.optimisticPosts.map((post) =>
        post.tempId === tempId
          ? {
              ...post,
              status: 'uploading' as const,
              error: undefined,
              // Reset all media to pending
              media: post.media.map((m) => ({
                ...m,
                uploadStatus: 'pending' as const,
                uploadProgress: 0,
                error: undefined,
              })),
              updatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
  },

  // ============================================================================
  // Helpers
  // ============================================================================

  hasUploadingPosts: () => {
    return get().optimisticPosts.some(
      (post) => post.status === 'uploading' || post.status === 'creating_post'
    );
  },

  getOptimisticPost: (tempId) => {
    return get().optimisticPosts.find((post) => post.tempId === tempId);
  },

  // ============================================================================
  // Phase 2: IndexedDB Persistence
  // ============================================================================

  restoreFromIndexedDB: async () => {
    if (!isIndexedDBSupported()) {
      console.warn('⚠️ IndexedDB not supported - skipping restore');
      return;
    }

    try {
      console.log('📥 Restoring optimistic posts from IndexedDB...');
      const storedPosts = await getAllOptimisticPosts();

      if (storedPosts.length === 0) {
        console.log('✅ No posts to restore');
        return;
      }

      // Convert stored posts to in-memory format
      const restoredPosts = storedPosts.map(fromStoredPost);

      // Filter out completed posts (they should have been cleaned up)
      const activePosts = restoredPosts.filter((post) => post.status !== 'completed');

      if (activePosts.length > 0) {
        set({ optimisticPosts: activePosts });
        console.log(`✅ Restored ${activePosts.length} posts from IndexedDB`);
      } else {
        console.log('✅ No active posts to restore (all completed)');
      }
    } catch (error) {
      console.error('❌ Failed to restore from IndexedDB:', error);
    }
  },

  syncToIndexedDB: async () => {
    if (!isIndexedDBSupported()) {
      console.warn('⚠️ IndexedDB not supported - skipping sync');
      return;
    }

    try {
      const posts = get().optimisticPosts;

      for (const post of posts) {
        await syncPostToIndexedDB(post);
      }

      console.log(`✅ Synced ${posts.length} posts to IndexedDB`);
    } catch (error) {
      console.error('❌ Failed to sync to IndexedDB:', error);
    }
  },
}));
