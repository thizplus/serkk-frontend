import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import userService from '@/lib/services/api/user.service';
import type { PaginationParams } from '@/lib/types/common';

/**
 * Query Keys สำหรับ User-related queries
 * ใช้สำหรับ cache management และ invalidation
 */
export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  userProfile: (username: string) => [...userKeys.all, 'user-profile', username] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...userKeys.lists(), params] as const,
};

/**
 * ดึงข้อมูลโปรไฟล์ของ current user
 *
 * @returns React Query result with User data
 * @throws Error เมื่อไม่สามารถดึงข้อมูล profile ได้
 *
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useProfile();
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error message={error.message} />;
 * return <div>Hello {user?.displayName}</div>;
 * ```
 */
export function useProfile() {
  // ใช้ state เพื่อ track token แทนการตรวจสอบโดยตรง
  const [hasToken, setHasToken] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(localStorage.getItem('auth_token') || document.cookie.includes('auth_token='));
  });

  // ตรวจสอบ token เมื่อ component mount และเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkToken = () => {
      const tokenExists = !!(localStorage.getItem('auth_token') || document.cookie.includes('auth_token='));
      setHasToken(tokenExists);
    };

    // ตรวจสอบทันทีและทุกๆ 500ms
    checkToken();
    const interval = setInterval(checkToken, 500);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      try {
        const response = await userService.getProfile();

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch profile');
        }

        if (!response.data) {
          throw new Error('No profile data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: hasToken, // เรียก API เฉพาะเมื่อมี token เท่านั้น
    staleTime: 2 * 60 * 1000, // 2 minutes - ลดเวลาเพื่อให้อัพเดทเร็วขึ้น
    refetchOnWindowFocus: true, // ✅ เปิด auto refetch เมื่อ focus window
    retry: false, // ไม่ retry เมื่อ error
  });
}

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้อื่น (Public API)
 *
 * @param username - Username ของผู้ใช้ที่ต้องการดู
 * @param options - Query options (enabled)
 * @returns React Query result with User data (+ isFollowing if logged in)
 * @throws Error เมื่อไม่สามารถดึงข้อมูล profile ได้
 *
 * @example
 * ```tsx
 * const { data: userProfile, isLoading, error } = useUserProfile('thepthai', { enabled: true });
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Error message={error.message} />;
 * return (
 *   <div>
 *     <h1>{userProfile?.displayName}</h1>
 *     {userProfile?.isFollowing && <Badge>Following</Badge>}
 *   </div>
 * );
 * ```
 */
export function useUserProfile(username: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.userProfile(username),
    queryFn: async () => {
      try {
        const response = await userService.getUserProfile(username);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch user profile');
        }

        if (!response.data) {
          throw new Error('No user profile data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!username, // เรียก API เฉพาะเมื่อมี username หรือตาม options
    staleTime: 2 * 60 * 1000, // 2 minutes - profile data ไม่เปลี่ยนบ่อย
    refetchOnWindowFocus: false, // ปิด auto refetch เมื่อ focus window
    retry: 1, // Retry once on failure
  });
}

/**
 * ดึงรายการ users ทั้งหมด (Admin only)
 *
 * @param params - Pagination parameters (offset, limit)
 * @param enabled - Enable/disable auto-fetch (default: false for admin-only feature)
 * @returns React Query result with paginated users data
 * @throws Error เมื่อไม่สามารถดึงข้อมูล users ได้ หรือไม่มีสิทธิ์เข้าถึง
 *
 * @example
 * ```tsx
 * // Manual trigger (recommended for admin features)
 * const { data, refetch, isLoading } = useUsers({ offset: 0, limit: 10 });
 *
 * const handleLoadUsers = () => {
 *   refetch();
 * };
 *
 * // Auto-fetch (use with caution)
 * const { data, isLoading } = useUsers({ offset: 0, limit: 10 }, true);
 * ```
 */
export function useUsers(params?: PaginationParams, enabled = false) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      try {
        const response = await userService.listUsers(params);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch users');
        }

        if (!response.data) {
          throw new Error('No users data returned');
        }

        return response.data;
      } catch (error) {
        console.error('❌ Error fetching users:', error);

        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('403') || error.message.includes('Forbidden')) {
            throw new Error('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (Admin only)');
          }
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            throw new Error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
          }
          throw error;
        }

        throw new Error('An unknown error occurred while fetching users');
      }
    },
    enabled, // Manual trigger by default (admin feature)
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Retry once on failure
  });
}
