import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OptimisticPost {
  tempId: string; // UUID สำหรับ temp post
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
    // NOTE: File object ไม่ persist ใน localStorage (ใหญ่เกินไป)
    preview: string; // blob URL
    uploadProgress: number; // 0-100
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
    error?: string;
    mediaId?: string; // จาก confirmUpload
    url?: string; // จาก confirmUpload (R2 URL)
  }[];
  status: 'uploading' | 'completed' | 'failed';
  createdAt: string;
}

interface OptimisticPostState {
  optimisticPosts: OptimisticPost[];

  // Actions
  addOptimisticPost: (post: Omit<OptimisticPost, 'status' | 'createdAt' | 'tempId' | 'media'> & {
    media: {
      file: File;
      preview: string;
    }[];
  }) => string; // return tempId

  updateUploadProgress: (tempId: string, mediaIndex: number, progress: number) => void;

  markUploadComplete: (tempId: string, mediaIndex: number, mediaId: string, url: string) => void;

  markUploadFailed: (tempId: string, mediaIndex: number, error: string) => void;

  markPostComplete: (tempId: string) => void;

  markPostFailed: (tempId: string, error: string) => void;

  removeOptimisticPost: (tempId: string) => void;

  clearCompletedPosts: () => void;

  // Get posts ที่กำลัง upload (สำหรับ beforeunload warning)
  hasUploadingPosts: () => boolean;
}

export const useOptimisticPostStore = create<OptimisticPostState>()(
  persist(
    (set, get) => ({
      optimisticPosts: [],

      addOptimisticPost: (postData) => {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const optimisticPost: OptimisticPost = {
          tempId,
          title: postData.title,
          content: postData.content,
          tags: postData.tags,
          author: postData.author,
          media: postData.media.map(m => ({
            preview: m.preview,
            uploadProgress: 0,
            uploadStatus: 'pending',
          })),
          status: 'uploading',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          optimisticPosts: [optimisticPost, ...state.optimisticPosts],
        }));

        return tempId;
      },

      updateUploadProgress: (tempId, mediaIndex, progress) => {
        set((state) => ({
          optimisticPosts: state.optimisticPosts.map((post) =>
            post.tempId === tempId
              ? {
                  ...post,
                  media: post.media.map((m, i) =>
                    i === mediaIndex
                      ? { ...m, uploadProgress: progress, uploadStatus: 'uploading' as const }
                      : m
                  ),
                }
              : post
          ),
        }));
      },

      markUploadComplete: (tempId, mediaIndex, mediaId, url) => {
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
                }
              : post
          ),
        }));
      },

      markUploadFailed: (tempId, mediaIndex, error) => {
        set((state) => ({
          optimisticPosts: state.optimisticPosts.map((post) =>
            post.tempId === tempId
              ? {
                  ...post,
                  media: post.media.map((m, i) =>
                    i === mediaIndex
                      ? { ...m, uploadStatus: 'failed' as const, error }
                      : m
                  ),
                  status: 'failed' as const,
                }
              : post
          ),
        }));
      },

      markPostComplete: (tempId) => {
        set((state) => ({
          optimisticPosts: state.optimisticPosts.map((post) =>
            post.tempId === tempId ? { ...post, status: 'completed' as const } : post
          ),
        }));

        // Auto-remove หลัง 2 วินาที (เพื่อให้ real post จาก API มาแทนที่)
        setTimeout(() => {
          get().removeOptimisticPost(tempId);
        }, 2000);
      },

      markPostFailed: (tempId, error) => {
        set((state) => ({
          optimisticPosts: state.optimisticPosts.map((post) =>
            post.tempId === tempId
              ? { ...post, status: 'failed' as const }
              : post
          ),
        }));
      },

      removeOptimisticPost: (tempId) => {
        set((state) => ({
          optimisticPosts: state.optimisticPosts.filter((post) => post.tempId !== tempId),
        }));
      },

      clearCompletedPosts: () => {
        set((state) => ({
          optimisticPosts: state.optimisticPosts.filter((post) => post.status !== 'completed'),
        }));
      },

      hasUploadingPosts: () => {
        return get().optimisticPosts.some((post) => post.status === 'uploading');
      },
    }),
    {
      name: 'optimistic-posts-storage',
      // ⚠️ ไม่ persist File objects (ใหญ่เกินไป + localStorage ไม่รองรับ)
      partialize: (state) => ({
        optimisticPosts: state.optimisticPosts.map((post) => ({
          ...post,
          // เก็บแค่ metadata, ไม่เก็บ File object
        })),
      }),
    }
  )
);
