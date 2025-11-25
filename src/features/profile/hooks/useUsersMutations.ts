"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import userService from '../services/user.service';
import { useAuthStore } from '@/features/auth';
import type { UpdateProfileRequest } from '@/types/request';
import { toast } from 'sonner';
import { userKeys } from './useUsers';

/**
 * Update Profile mutation
 * ⭐ Simplified: อัปเดตทุก fields ผ่าน Backend Service (8080) เพียง 1 API call
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      console.log('🔄 Profile update mutation started');

      // ⭐ Single API call to Backend Service
      const response = await userService.updateProfile(data);

      console.log('📡 Profile update API response:', {
        success: response.success,
        hasData: !!response.data,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Update profile failed');
      }

      return response.data;
    },
    onSuccess: async (data) => {
      console.log('✅ Profile update onSuccess:', data);

      // Update Zustand store
      if (data) {
        console.log('🔄 Updating Zustand store with profile data');
        setUser(data);
      }

      // Invalidate and refetch React Query cache
      await queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      await queryClient.refetchQueries({ queryKey: userKeys.profile() });

      toast.success('อัปเดตโปรไฟล์สำเร็จ!');

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 200));

      // Redirect to profile page
      if (user?.username) {
        router.push(`/profile/${user.username}`);
      } else {
        router.push('/');
      }
    },
    onError: (error: Error) => {
      console.error('❌ Profile update error:', error);
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
