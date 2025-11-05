import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import userService from '@/lib/services/api/user.service';
import { useAuthStore } from '@/lib/stores/authStore';
import type { UpdateProfileRequest } from '@/lib/types/request';
import { toast } from 'sonner';
import { userKeys } from '../queries/useUsers';

/**
 * Update Profile mutation
 * อัปเดตข้อมูล profile ของผู้ใช้ปัจจุบัน
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      console.log('🔄 Update profile mutation started');
      const response = await userService.updateProfile(data);

      console.log('📡 Update profile API response:', {
        success: response.success,
        hasData: !!response.data,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Update profile failed');
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Update profile mutation onSuccess:', {
        hasData: !!data,
        username: data?.username,
      });

      // ⭐ อัปเดต Zustand store
      if (data) {
        setUser(data);
      }

      // Invalidate profile query เพื่อให้ refetch
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      toast.success('อัปเดตโปรไฟล์สำเร็จ!');

      // Redirect ไปหน้า profile
      if (user?.username) {
        router.push(`/profile/${user.username}`);
      } else if (data?.username) {
        router.push(`/profile/${data.username}`);
      } else {
        router.push('/');
      }
    },
    onError: (error: Error) => {
      console.error('❌ Update profile error:', error);
      toast.error(error.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
    },
  });
}

/**
 * Delete Account mutation
 * ลบบัญชีผู้ใช้
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      console.log('🗑️ Delete account mutation started');
      const response = await userService.deleteAccount();

      if (!response.success) {
        throw new Error(response.message || 'Delete account failed');
      }

      return response;
    },
    onSuccess: () => {
      console.log('✅ Delete account mutation onSuccess');

      // Clear all auth state
      clearAuth();
      queryClient.clear();

      toast.success('ลบบัญชีสำเร็จ');
      router.push('/');
    },
    onError: (error: Error) => {
      console.error('❌ Delete account error:', error);
      toast.error(error.message || 'ไม่สามารถลบบัญชีได้');
    },
  });
}
