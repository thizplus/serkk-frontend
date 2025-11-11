"use client";

// ============================================================================
// Follow Mutations
// React Query hooks สำหรับการ Follow/Unfollow ผู้ใช้
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import followService from '../services/follow.service';
import { userKeys } from './useUsers';
import type { UserWithFollowStatus } from '@/types/models';
import { useAuthStore } from '@/features/auth';
import { TOAST_MESSAGES } from '@/config';

// ============================================================================
// MUTATION: FOLLOW USER
// ============================================================================

/**
 * Hook สำหรับติดตามผู้ใช้
 *
 * Features:
 * - Optimistic updates สำหรับ UX ที่รวดเร็ว
 * - Auto-invalidate user profile queries
 * - Error handling with rollback
 * - Toast notifications
 *
 * @example
 * const follow = useFollowUser();
 * follow.mutate(userId);
 */
export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await followService.follow(userId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to follow user');
      }
      return response.data;
    },
    onMutate: async (userId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['users']
      });

      // Optimistic update: อัพเดท user profile cache
      queryClient.setQueriesData(
        { queryKey: ['users', 'user-profile'] },
        (oldData: UserWithFollowStatus | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            isFollowing: true,
            followersCount: (oldData.followersCount || 0) + 1,
          };
        }
      );
    },
    onSuccess: (data, userId) => {
      // Invalidate user profile queries เพื่อให้ข้อมูลถูกต้อง
      queryClient.invalidateQueries({
        queryKey: ['users', 'user-profile']
      });

      // Invalidate followers/following lists
      queryClient.invalidateQueries({
        queryKey: ['follows']
      });

      // ✅ Invalidate profile ของตัวเองเพื่อให้ refetch followingCount
      queryClient.invalidateQueries({
        queryKey: ['users', 'profile']
      });

      // อัพเดท Zustand store - เพิ่ม followingCount
      if (user) {
        setUser({
          ...user,
          followingCount: (user.followingCount || 0) + 1,
        });
      }

      toast.success(TOAST_MESSAGES.PROFILE.FOLLOW_SUCCESS);
    },
    onError: (error, userId) => {
      toast.error(TOAST_MESSAGES.PROFILE.FOLLOW_ERROR);

      // Refetch เพื่อแก้ไข optimistic update
      queryClient.invalidateQueries({
        queryKey: ['users', 'user-profile']
      });
    },
  });
}

// ============================================================================
// MUTATION: UNFOLLOW USER
// ============================================================================

/**
 * Hook สำหรับเลิกติดตามผู้ใช้
 *
 * @example
 * const unfollow = useUnfollowUser();
 * unfollow.mutate(userId);
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await followService.unfollow(userId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unfollow user');
      }
      return response.data;
    },
    onMutate: async (userId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['users']
      });

      // Optimistic update: อัพเดท user profile cache
      queryClient.setQueriesData(
        { queryKey: ['users', 'user-profile'] },
        (oldData: UserWithFollowStatus | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            isFollowing: false,
            followersCount: Math.max((oldData.followersCount || 1) - 1, 0),
          };
        }
      );
    },
    onSuccess: (data, userId) => {
      // Invalidate user profile queries เพื่อให้ข้อมูลถูกต้อง
      queryClient.invalidateQueries({
        queryKey: ['users', 'user-profile']
      });

      // Invalidate followers/following lists
      queryClient.invalidateQueries({
        queryKey: ['follows']
      });

      // ✅ Invalidate profile ของตัวเองเพื่อให้ refetch followingCount
      queryClient.invalidateQueries({
        queryKey: ['users', 'profile']
      });

      // อัพเดท Zustand store - ลด followingCount
      if (user) {
        setUser({
          ...user,
          followingCount: Math.max((user.followingCount || 1) - 1, 0),
        });
      }

      toast.success(TOAST_MESSAGES.PROFILE.UNFOLLOW_SUCCESS);
    },
    onError: (error, userId) => {
      toast.error(TOAST_MESSAGES.PROFILE.UNFOLLOW_ERROR);

      // Refetch เพื่อแก้ไข optimistic update
      queryClient.invalidateQueries({
        queryKey: ['users', 'user-profile']
      });
    },
  });
}

// ============================================================================
// HELPER HOOK: TOGGLE FOLLOW
// ============================================================================

/**
 * Hook สำหรับจัดการ follow logic (toggle between follow/unfollow)
 *
 * @example
 * const { handleToggleFollow, isLoading } = useToggleFollow();
 * handleToggleFollow(userId, isFollowing);
 */
export function useToggleFollow() {
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const handleToggleFollow = (userId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      unfollow.mutate(userId);
    } else {
      follow.mutate(userId);
    }
  };

  return {
    handleToggleFollow,
    isLoading: follow.isPending || unfollow.isPending,
  };
}
