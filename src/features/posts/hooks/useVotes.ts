"use client";

// ============================================================================
// Vote Mutations
// React Query hooks สำหรับการโหวต (upvote/downvote) โพสต์และคอมเมนต์
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import voteService from '@/lib/api/vote.service';
import type { VoteRequest } from '@/types/request';
import type { TargetType, UserVote } from '@/types/common';
import { TOAST_MESSAGES } from '@/config';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * อัพเดท comment ในโครงสร้าง tree แบบ recursive
 */
function updateCommentInTree(
  comments: any[],
  targetId: string,
  updateFn: (comment: any) => any
): any[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return updateFn(comment);
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, targetId, updateFn),
      };
    }
    return comment;
  });
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const voteKeys = {
  all: ['votes'] as const,
  user: (targetType: TargetType, targetId: string) =>
    [...voteKeys.all, 'user', targetType, targetId] as const,
  count: (targetType: TargetType, targetId: string) =>
    [...voteKeys.all, 'count', targetType, targetId] as const,
  userVotes: () => [...voteKeys.all, 'user-votes'] as const,
};

// ============================================================================
// MUTATION: VOTE
// ============================================================================

/**
 * Hook สำหรับโหวต (upvote/downvote)
 *
 * Features:
 * - Optimistic updates สำหรับ UX ที่รวดเร็ว
 * - Auto-invalidate related queries
 * - Error handling with rollback
 * - Toast notifications
 *
 * @example
 * const vote = useVote();
 * vote.mutate({ targetId: 'post-123', targetType: 'post', voteType: 'upvote' });
 */
export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VoteRequest) => {
      const response = await voteService.vote(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to vote');
      }
      return response.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['posts']
      });
      await queryClient.cancelQueries({
        queryKey: ['comments']
      });

      // ✅ Optimistic update สำหรับ Posts
      if (variables.targetType === 'post') {
        const previousData = queryClient.getQueriesData({ queryKey: ['posts'] });

        // Helper function สำหรับอัพเดท post object
        const updatePostVote = (post: any) => {
          if (post.id !== variables.targetId) return post;

          const voteChange = variables.voteType === 'up' ? 1 : -1;
          const previousVote = post.userVote;
          let newVotes = post.votes;

          // คำนวณ votes ใหม่
          if (previousVote === 'up') {
            newVotes = newVotes - 1 + voteChange;
          } else if (previousVote === 'down') {
            newVotes = newVotes + 1 + voteChange;
          } else {
            newVotes = newVotes + voteChange;
          }

          return {
            ...post,
            votes: newVotes,
            userVote: variables.voteType,
          };
        };

        queryClient.setQueriesData(
          { queryKey: ['posts'] },
          (oldData: any) => {
            if (!oldData) return oldData;

            // ✅ Case 1: Infinite Query format (pages)
            if (oldData.pages && Array.isArray(oldData.pages)) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  posts: Array.isArray(page.posts)
                    ? page.posts.map(updatePostVote)
                    : page.posts,
                })),
              };
            }

            // ✅ Case 2: Normal Array format
            if (Array.isArray(oldData)) {
              return oldData.map(updatePostVote);
            }

            // ✅ Case 3: Single Post object (detail page)
            if (oldData.id) {
              return updatePostVote(oldData);
            }

            return oldData;
          }
        );

        return { previousData };
      }

      // ✅ Optimistic update สำหรับ Comments
      if (variables.targetType === 'comment') {
        const previousData = queryClient.getQueriesData({ queryKey: ['comments'] });

        queryClient.setQueriesData(
          { queryKey: ['comments'] },
          (oldData: any) => {
            if (!oldData?.length) return oldData;

            return updateCommentInTree(oldData, variables.targetId, (comment) => {
              const voteChange = variables.voteType === 'up' ? 1 : -1;
              const previousVote = comment.userVote;
              let newVotes = comment.votes;

              // คำนวณ votes ใหม่
              if (previousVote === 'up') {
                newVotes = newVotes - 1 + voteChange;
              } else if (previousVote === 'down') {
                newVotes = newVotes + 1 + voteChange;
              } else {
                newVotes = newVotes + voteChange;
              }

              return {
                ...comment,
                votes: newVotes,
                userVote: variables.voteType,
              };
            });
          }
        );

        return { previousData };
      }
    },
    onSuccess: (data, variables) => {
      // ✅ Optimistic update ทำใน onMutate แล้ว
      // ที่นี่แค่ invalidate related queries เพื่อ sync กับ server response (ถ้าจำเป็น)

      // ไม่ invalidate posts/comments query เพื่อไม่ให้ลำดับขยับ
      // Optimistic update ที่ทำไว้แล้วเพียงพอ

      queryClient.invalidateQueries({
        queryKey: voteKeys.user(variables.targetType, variables.targetId)
      });
      queryClient.invalidateQueries({
        queryKey: voteKeys.count(variables.targetType, variables.targetId)
      });

      // Toast notification - เงียบๆ ไม่ต้องแจ้งทุกครั้ง
      // toast.success('โหวตสำเร็จ');
    },
    onError: (error, variables, context: any) => {
      // ✅ Rollback optimistic update
      if (context?.previousData) {
        // Restore previous data
        context.previousData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(TOAST_MESSAGES.POST.VOTE_ERROR);

      // Refetch เพื่อให้แน่ใจว่า sync กับ server (หลังจาก rollback แล้ว)
      setTimeout(() => {
        if (variables.targetType === 'post') {
          queryClient.refetchQueries({ queryKey: ['posts'] });
        } else {
          queryClient.refetchQueries({ queryKey: ['comments'] });
        }
      }, 1000); // refetch หลัง 1 วินาที
    },
  });
}

// ============================================================================
// MUTATION: UNVOTE
// ============================================================================

/**
 * Hook สำหรับยกเลิกการโหวต
 *
 * @example
 * const unvote = useUnvote();
 * unvote.mutate({ targetType: 'post', targetId: 'post-123' });
 */
export function useUnvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { targetType: TargetType; targetId: string }) => {
      const response = await voteService.unvote(data.targetType, data.targetId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unvote');
      }
      return response.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['comments'] });

      // ✅ Optimistic update สำหรับ Posts
      if (variables.targetType === 'post') {
        const previousData = queryClient.getQueriesData({ queryKey: ['posts'] });

        // Helper function สำหรับอัพเดท post object (unvote)
        const updatePostUnvote = (post: any) => {
          if (post.id !== variables.targetId) return post;

          const previousVote = post.userVote;
          let newVotes = post.votes;

          // คำนวณ votes ใหม่เมื่อยกเลิก vote
          if (previousVote === 'up') {
            newVotes = newVotes - 1; // ยกเลิก +1
          } else if (previousVote === 'down') {
            newVotes = newVotes + 1; // ยกเลิก -1
          }

          return {
            ...post,
            votes: newVotes,
            userVote: null,
          };
        };

        queryClient.setQueriesData(
          { queryKey: ['posts'] },
          (oldData: any) => {
            if (!oldData) return oldData;

            // ✅ Case 1: Infinite Query format (pages)
            if (oldData.pages && Array.isArray(oldData.pages)) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  posts: Array.isArray(page.posts)
                    ? page.posts.map(updatePostUnvote)
                    : page.posts,
                })),
              };
            }

            // ✅ Case 2: Normal Array format
            if (Array.isArray(oldData)) {
              return oldData.map(updatePostUnvote);
            }

            // ✅ Case 3: Single Post object (detail page)
            if (oldData.id) {
              return updatePostUnvote(oldData);
            }

            return oldData;
          }
        );

        return { previousData };
      }

      // ✅ Optimistic update สำหรับ Comments
      if (variables.targetType === 'comment') {
        const previousData = queryClient.getQueriesData({ queryKey: ['comments'] });

        queryClient.setQueriesData(
          { queryKey: ['comments'] },
          (oldData: any) => {
            if (!oldData?.length) return oldData;

            return updateCommentInTree(oldData, variables.targetId, (comment) => {
              const previousVote = comment.userVote;
              let newVotes = comment.votes;

              // คำนวณ votes ใหม่เมื่อยกเลิก vote
              if (previousVote === 'up') {
                newVotes = newVotes - 1; // ยกเลิก +1
              } else if (previousVote === 'down') {
                newVotes = newVotes + 1; // ยกเลิก -1
              }

              return {
                ...comment,
                votes: newVotes,
                userVote: null,
              };
            });
          }
        );

        return { previousData };
      }
    },
    onSuccess: (data, variables) => {
      // ✅ Optimistic update ทำใน onMutate แล้ว
      // ที่นี่แค่ invalidate related queries เพื่อ sync กับ server response (ถ้าจำเป็น)

      // ไม่ invalidate posts/comments query เพื่อไม่ให้ลำดับขยับ
      // Optimistic update ที่ทำไว้แล้วเพียงพอ

      queryClient.invalidateQueries({
        queryKey: voteKeys.user(variables.targetType, variables.targetId)
      });
      queryClient.invalidateQueries({
        queryKey: voteKeys.count(variables.targetType, variables.targetId)
      });
    },
    onError: (error, variables, context: any) => {
      // ✅ Rollback optimistic update
      if (context?.previousData) {
        // Restore previous data
        context.previousData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(TOAST_MESSAGES.POST.VOTE_ERROR);

      // Refetch เพื่อให้แน่ใจว่า sync กับ server (หลังจาก rollback แล้ว)
      setTimeout(() => {
        if (variables.targetType === 'post') {
          queryClient.refetchQueries({ queryKey: ['posts'] });
        } else {
          queryClient.refetchQueries({ queryKey: ['comments'] });
        }
      }, 1000); // refetch หลัง 1 วินาที
    },
  });
}

// ============================================================================
// HELPER HOOK: TOGGLE VOTE
// ============================================================================

/**
 * Hook สำหรับจัดการ vote logic (toggle between upvote/downvote/unvote)
 *
 * Logic:
 * - ถ้ากดปุ่มเดิมอีกครั้ง → ยกเลิกโหวต (unvote)
 * - ถ้ามีโหวตแล้วแล้วกดปุ่มตรงข้าม → เปลี่ยนเป็นโหวตใหม่ (vote)
 * - ถ้ายังไม่ได้โหวต → โหวตใหม่ (vote)
 *
 * @example
 * const { handleVote } = useToggleVote();
 * handleVote('post-123', 'post', 'upvote', currentUserVote);
 */
export function useToggleVote() {
  const vote = useVote();
  const unvote = useUnvote();

  const handleVote = (
    targetId: string,
    targetType: TargetType,
    voteType: 'up' | 'down',
    currentUserVote: UserVote | null
  ) => {
    // ถ้ากดปุ่มเดิมอีกครั้ง → ยกเลิกโหวต
    if (currentUserVote === voteType) {
      unvote.mutate({ targetType, targetId });
      return;
    }

    // ถ้ามีโหวตแล้วแล้วกดปุ่มตรงข้าม หรือ ยังไม่ได้โหวต → โหวตใหม่
    vote.mutate({ targetId, targetType, voteType });
  };

  return {
    handleVote,
    isVoting: vote.isPending || unvote.isPending,
  };
}
