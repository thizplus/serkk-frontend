"use client";

// ============================================================================
// Comment Queries
// React Query hooks สำหรับ Comments
// ============================================================================

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import commentService from '../services/comment.service';
import type {
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsParams,
  GetCommentsCursorParams
} from '@/types/request';
import { TOAST_MESSAGES } from '@/config';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (postId: string, params?: GetCommentsParams) =>
    [...commentKeys.lists(), postId, params] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
  tree: (postId: string) => [...commentKeys.all, 'tree', postId] as const,
};

// ============================================================================
// QUERY: GET COMMENTS
// ============================================================================

/**
 * Hook สำหรับดึงความคิดเห็นของโพสต์
 *
 * @param postId - ID ของโพสต์
 * @param params - พารามิเตอร์ (sortBy, offset, limit)
 */
export function useComments(postId: string, params?: GetCommentsParams) {
  return useQuery({
    queryKey: commentKeys.list(postId, params),
    queryFn: async () => {
      const response = await commentService.getByPostId(postId, params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch comments');
      }
      return response.data.comments || [];
    },
    enabled: !!postId,
  });
}

/**
 * Hook สำหรับดึง comment tree แบบ nested ของทั้ง post
 */
export function useCommentTree(postId: string, params?: { maxDepth?: number }) {
  return useQuery({
    queryKey: commentKeys.tree(postId),
    queryFn: async () => {
      const response = await commentService.getPostTree(postId, params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch comment tree');
      }
      return response.data.comments || [];
    },
    enabled: !!postId,
  });
}

/**
 * Hook สำหรับดึงความคิดเห็นทั้งหมดของผู้ใช้
 *
 * @param userId - ID ของผู้ใช้
 * @param params - พารามิเตอร์ (offset, limit)
 */
export function useCommentsByAuthor(userId: string, params?: GetCommentsParams) {
  return useQuery({
    queryKey: [...commentKeys.all, 'author', userId, params] as const,
    queryFn: async () => {
      const response = await commentService.getByAuthor(userId, params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user comments');
      }
      return response.data.comments || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// INFINITE SCROLL QUERIES - NEW (Cursor-based)
// ============================================================================

/**
 * Infinite scroll สำหรับคอมเมนต์ของโพสต์ (Cursor-based)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteComments(postId, { sortBy: 'hot' });
 */
export function useInfiniteComments(
  postId: string,
  params?: Omit<GetCommentsCursorParams, 'cursor'>
) {
  return useInfiniteQuery({
    queryKey: [...commentKeys.list(postId), 'infinite', params] as const,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const response = await commentService.getByPostId(postId, {
        ...params,
        cursor: pageParam,
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch comments');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // ใช้ hasMore และ nextCursor จาก backend
      return lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined;
    },
    initialPageParam: undefined,
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Infinite scroll สำหรับ replies ของคอมเมนต์ (Cursor-based)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteReplies(commentId);
 */
export function useInfiniteReplies(
  commentId: string,
  params?: Omit<GetCommentsCursorParams, 'cursor'>
) {
  return useInfiniteQuery({
    queryKey: [...commentKeys.all, 'replies', commentId, 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await commentService.getReplies(commentId, {
        ...params,
        cursor: pageParam,
        limit: params?.limit || 10,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch replies');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined;
    },
    initialPageParam: undefined,
    enabled: !!commentId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Infinite scroll สำหรับคอมเมนต์ทั้งหมดของผู้ใช้ (Cursor-based)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteCommentsByAuthor(userId);
 */
export function useInfiniteCommentsByAuthor(
  userId: string,
  params?: Omit<GetCommentsCursorParams, 'cursor'>,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [...commentKeys.all, 'author', userId, 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await commentService.getByAuthor(userId, {
        ...params,
        cursor: pageParam,
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch user comments');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined;
    },
    initialPageParam: undefined,
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION: CREATE COMMENT
// ============================================================================

/**
 * Hook สำหรับสร้างความคิดเห็นใหม่
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentRequest) => {
      const response = await commentService.create(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create comment');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate ALL comment queries to refresh everything
      queryClient.invalidateQueries({
        queryKey: commentKeys.all
      });
      // Invalidate post to update comment count
      queryClient.invalidateQueries({
        queryKey: ['posts']
      });

      toast.success(TOAST_MESSAGES.COMMENT.CREATE_SUCCESS);
    },
    onError: (error) => {
      toast.error(TOAST_MESSAGES.COMMENT.CREATE_ERROR);
    },
  });
}

// ============================================================================
// MUTATION: UPDATE COMMENT
// ============================================================================

/**
 * Hook สำหรับแก้ไขความคิดเห็น
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateCommentRequest
    }) => {
      const response = await commentService.update(id, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update comment');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Update comment in cache
      queryClient.setQueryData(commentKeys.detail(data.id), data);

      // Invalidate ALL comment queries to refresh everything
      queryClient.invalidateQueries({
        queryKey: commentKeys.all
      });

      toast.success(TOAST_MESSAGES.COMMENT.UPDATE_SUCCESS);
    },
    onError: (error) => {
      toast.error(TOAST_MESSAGES.COMMENT.UPDATE_ERROR);
    },
  });
}

// ============================================================================
// MUTATION: DELETE COMMENT
// ============================================================================

/**
 * Hook สำหรับลบความคิดเห็น
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await commentService.delete(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete comment');
      }
      return id;
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: commentKeys.detail(id)
      });

      // Invalidate ALL comment queries (lists, trees, etc.)
      queryClient.invalidateQueries({
        queryKey: commentKeys.all
      });
      // Invalidate post to update comment count
      queryClient.invalidateQueries({
        queryKey: ['posts']
      });

      toast.success(TOAST_MESSAGES.COMMENT.DELETE_SUCCESS);
    },
    onError: (error) => {
      toast.error(TOAST_MESSAGES.COMMENT.DELETE_ERROR);
    },
  });
}
