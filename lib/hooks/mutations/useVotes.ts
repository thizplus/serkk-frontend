// ============================================================================
// Vote Mutations
// React Query hooks สำหรับการโหวต (upvote/downvote) โพสต์และคอมเมนต์
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import voteService from '@/lib/services/api/vote.service';
import type { VoteRequest } from '@/lib/types/request';
import type { TargetType, UserVote } from '@/lib/types/common';

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

      // Optimistic update จะทำใน component เพราะต้องรู้ current state
      // Component จะจัดการ optimistic UI เอง
    },
    onSuccess: (data, variables) => {
      // Invalidate posts เพื่อ update vote count
      queryClient.invalidateQueries({
        queryKey: ['posts']
      });

      // ไม่ต้อง invalidate comments เพื่อไม่ให้เรียงลำดับใหม่ทันที
      // แค่ update cache โดยตรง
      if (variables.targetType === 'comment') {
        // Update comment votes ใน cache โดยไม่ re-fetch (รองรับทั้ง flat array และ tree structure)
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
                newVotes = newVotes - 1 + voteChange; // ยกเลิก +1 เดิม แล้วบวกใหม่
              } else if (previousVote === 'down') {
                newVotes = newVotes + 1 + voteChange; // ยกเลิก -1 เดิม แล้วบวกใหม่
              } else {
                newVotes = newVotes + voteChange; // ยังไม่เคย vote
              }

              return {
                ...comment,
                votes: newVotes,
                userVote: variables.voteType,
              };
            });
          }
        );
      }

      queryClient.invalidateQueries({
        queryKey: voteKeys.user(variables.targetType, variables.targetId)
      });
      queryClient.invalidateQueries({
        queryKey: voteKeys.count(variables.targetType, variables.targetId)
      });

      // Toast notification - เงียบๆ ไม่ต้องแจ้งทุกครั้ง
      // toast.success('โหวตสำเร็จ');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update ใน component
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถโหวตได้ กรุณาลองใหม่อีกครั้ง'
      );

      // Invalidate เพื่อ refetch ข้อมูลจริง
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // ไม่ invalidate comments เพื่อไม่ให้เรียงลำดับใหม่
      // แต่ถ้า error จริงๆ ให้ refetch เงียบๆ ในภายหลัง
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['comments'] });
      }, 5000); // refetch หลัง 5 วินาที
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
    },
    onSuccess: (data, variables) => {
      // Invalidate posts เพื่อ update vote count
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // ไม่ต้อง invalidate comments เพื่อไม่ให้เรียงลำดับใหม่ทันที
      // แค่ update cache โดยตรง
      if (variables.targetType === 'comment') {
        // Update comment votes ใน cache โดยไม่ re-fetch (รองรับทั้ง flat array และ tree structure)
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
      }

      queryClient.invalidateQueries({
        queryKey: voteKeys.user(variables.targetType, variables.targetId)
      });
      queryClient.invalidateQueries({
        queryKey: voteKeys.count(variables.targetType, variables.targetId)
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถยกเลิกโหวตได้'
      );

      // Invalidate เพื่อ refetch ข้อมูลจริง
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // ไม่ invalidate comments เพื่อไม่ให้เรียงลำดับใหม่
      // แต่ถ้า error จริงๆ ให้ refetch เงียบๆ ในภายหลัง
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['comments'] });
      }, 5000); // refetch หลัง 5 วินาที
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
