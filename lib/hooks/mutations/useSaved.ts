// ============================================================================
// Saved Post Mutations & Queries
// React Query hooks สำหรับการบันทึก/บุ๊คมาร์คโพสต์
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import savedService from '@/lib/services/api/saved.service';
import type { GetSavedPostsParams } from '@/lib/types/request';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const savedKeys = {
  all: ['saved'] as const,
  lists: () => [...savedKeys.all, 'list'] as const,
  list: (params?: GetSavedPostsParams) => [...savedKeys.lists(), params] as const,
  status: (postId: string) => [...savedKeys.all, 'status', postId] as const,
};

// ============================================================================
// QUERY: GET SAVED POSTS
// ============================================================================

/**
 * Hook สำหรับดึงรายการโพสต์ที่บันทึกไว้
 *
 * @example
 * const { data: savedPosts, isLoading } = useSavedPosts({ limit: 20 });
 */
export function useSavedPosts(params?: GetSavedPostsParams) {
  return useQuery({
    queryKey: savedKeys.list(params),
    queryFn: async () => {
      const response = await savedService.getSavedPosts(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch saved posts');
      }
      return response.data?.posts || [];
    },
  });
}

// ============================================================================
// MUTATION: SAVE POST
// ============================================================================

/**
 * Hook สำหรับบันทึกโพสต์
 *
 * Features:
 * - Optimistic updates สำหรับ UX ที่รวดเร็ว
 * - Auto-invalidate related queries
 * - Error handling with rollback
 * - Toast notifications
 *
 * @example
 * const savePost = useSavePost();
 * savePost.mutate('post-123');
 */
export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await savedService.save(postId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save post');
      }
      return response.data;
    },
    onMutate: async (postId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: savedKeys.lists() });

      // Optimistic update จะทำใน component เพราะต้องรู้ current state
    },
    onSuccess: (data, postId) => {
      // Invalidate queries ที่เกี่ยวข้อง
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: savedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: savedKeys.status(postId) });

      // Toast notification
      toast.success('บันทึกโพสต์แล้ว!');
    },
    onError: (error, postId, context) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถบันทึกโพสต์ได้ กรุณาลองใหม่อีกครั้ง'
      );

      // Invalidate เพื่อ refetch ข้อมูลจริง
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: savedKeys.lists() });
    },
  });
}

// ============================================================================
// MUTATION: UNSAVE POST
// ============================================================================

/**
 * Hook สำหรับยกเลิกการบันทึกโพสต์
 *
 * @example
 * const unsavePost = useUnsavePost();
 * unsavePost.mutate('post-123');
 */
export function useUnsavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await savedService.unsave(postId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unsave post');
      }
      return response.data;
    },
    onMutate: async (postId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: savedKeys.lists() });
    },
    onSuccess: (data, postId) => {
      // Invalidate queries ที่เกี่ยวข้อง
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: savedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: savedKeys.status(postId) });

      // Toast notification
      toast.success('ยกเลิกการบันทึกแล้ว');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถยกเลิกการบันทึกได้'
      );

      // Invalidate เพื่อ refetch ข้อมูลจริง
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: savedKeys.lists() });
    },
  });
}

// ============================================================================
// HELPER HOOK: TOGGLE SAVE
// ============================================================================

/**
 * Hook สำหรับจัดการ save/unsave logic (toggle)
 *
 * Logic:
 * - ถ้ายังไม่ได้บันทึก → บันทึก
 * - ถ้าบันทึกแล้ว → ยกเลิกการบันทึก
 *
 * @example
 * const { handleToggleSave } = useToggleSave();
 * handleToggleSave('post-123', currentIsSaved);
 */
export function useToggleSave() {
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const handleToggleSave = (postId: string, currentIsSaved: boolean) => {
    if (currentIsSaved) {
      unsavePost.mutate(postId);
    } else {
      savePost.mutate(postId);
    }
  };

  return {
    handleToggleSave,
    isSaving: savePost.isPending || unsavePost.isPending,
  };
}
