"use client";

// ============================================================================
// Follow Queries
// React Query hooks สำหรับดึงข้อมูล Followers และ Following
// ============================================================================

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import followService from '../services/follow.service';
import type { PaginationParams } from '@/types/common';
import type { GetFollowersCursorParams, GetFollowingCursorParams } from '@/types/request';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const followKeys = {
  all: ['follows'] as const,
  followers: (userId: string) => [...followKeys.all, 'followers', userId] as const,
  following: (userId: string) => [...followKeys.all, 'following', userId] as const,
  mutuals: () => [...followKeys.all, 'mutuals'] as const,
  status: (userId: string) => [...followKeys.all, 'status', userId] as const,
};

// ============================================================================
// QUERY: GET FOLLOWERS
// ============================================================================

/**
 * Hook สำหรับดึงรายชื่อผู้ติดตาม (Followers)
 *
 * @param userId - ID ของผู้ใช้ที่ต้องการดูรายชื่อผู้ติดตาม
 * @param params - Pagination parameters (offset, limit)
 * @param options - Query options (enabled)
 * @returns React Query result with followers list
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFollowers(userId, { limit: 20 });
 *
 * if (isLoading) return <Loader />;
 * return (
 *   <div>
 *     {data?.followers.map(user => (
 *       <UserCard key={user.id} user={user} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useFollowers(
  userId: string,
  params?: PaginationParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...followKeys.followers(userId), params] as const,
    queryFn: async () => {
      try {
        const response = await followService.getFollowers(userId, params);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch followers');
        }

        if (!response.data) {
          throw new Error('No followers data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching followers:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// QUERY: GET FOLLOWING
// ============================================================================

/**
 * Hook สำหรับดึงรายชื่อผู้ที่กำลังติดตาม (Following)
 *
 * @param userId - ID ของผู้ใช้ที่ต้องการดูรายชื่อผู้ที่ติดตาม
 * @param params - Pagination parameters (offset, limit)
 * @param options - Query options (enabled)
 * @returns React Query result with following list
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFollowing(userId, { limit: 20 });
 *
 * if (isLoading) return <Loader />;
 * return (
 *   <div>
 *     {data?.following.map(user => (
 *       <UserCard key={user.id} user={user} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useFollowing(
  userId: string,
  params?: PaginationParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...followKeys.following(userId), params] as const,
    queryFn: async () => {
      try {
        const response = await followService.getFollowing(userId, params);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch following');
        }

        if (!response.data) {
          throw new Error('No following data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching following:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// QUERY: GET MUTUAL FOLLOWS
// ============================================================================

/**
 * Hook สำหรับดึงรายชื่อเพื่อนร่วมกัน (Mutual Follows)
 * ผู้ใช้ที่ติดตามกันและกัน
 *
 * @param params - Pagination parameters (offset, limit)
 * @param options - Query options (enabled)
 * @returns React Query result with mutual follows list
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMutualFollows({ limit: 20 });
 * ```
 */
export function useMutualFollows(
  params?: PaginationParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...followKeys.mutuals(), params] as const,
    queryFn: async () => {
      try {
        const response = await followService.getMutualFollows(params);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch mutual follows');
        }

        if (!response.data) {
          throw new Error('No mutual follows data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching mutual follows:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// INFINITE SCROLL QUERIES - NEW (Cursor-based)
// ============================================================================

/**
 * Infinite scroll สำหรับรายชื่อผู้ติดตาม (Followers) - Cursor-based
 *
 * @param userId - ID ของผู้ใช้ที่ต้องการดูรายชื่อผู้ติดตาม
 * @param params - พารามิเตอร์ (limit)
 * @param options - Query options (enabled)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteFollowers(userId, { limit: 20 });
 */
export function useInfiniteFollowers(
  userId: string,
  params?: Omit<GetFollowersCursorParams, 'cursor'>,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [...followKeys.followers(userId), 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await followService.getFollowers(userId, {
        ...params,
        cursor: pageParam,
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch followers');
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

/**
 * Infinite scroll สำหรับรายชื่อผู้ที่กำลังติดตาม (Following) - Cursor-based
 *
 * @param userId - ID ของผู้ใช้ที่ต้องการดูรายชื่อผู้ที่ติดตาม
 * @param params - พารามิเตอร์ (limit)
 * @param options - Query options (enabled)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteFollowing(userId, { limit: 20 });
 */
export function useInfiniteFollowing(
  userId: string,
  params?: Omit<GetFollowingCursorParams, 'cursor'>,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [...followKeys.following(userId), 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await followService.getFollowing(userId, {
        ...params,
        cursor: pageParam,
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch following');
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
// QUERY: GET FOLLOW STATUS
// ============================================================================

/**
 * Hook สำหรับตรวจสอบสถานะการติดตาม
 *
 * @param userId - ID ของผู้ใช้ที่ต้องการตรวจสอบสถานะ
 * @param options - Query options (enabled)
 * @returns React Query result with follow status
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFollowStatus(userId);
 *
 * if (data?.isFollowing) {
 *   return <Button>Following</Button>;
 * }
 * ```
 */
export function useFollowStatus(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: followKeys.status(userId),
    queryFn: async () => {
      try {
        const response = await followService.getStatus(userId);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch follow status');
        }

        if (!response.data) {
          throw new Error('No follow status data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching follow status:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
    staleTime: 30 * 1000, // 30 seconds - status อาจเปลี่ยนบ่อย
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
