"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import authService from '../services/auth.service';
import userService from '@/features/profile/services/user.service';
import { useAuthStore } from '../stores/authStore';
import type { LoginRequest, RegisterRequest } from '@/types/request';
import type { User } from '@/types/models';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/config';

/**
 * Login mutation
 * เข้าสู่ระบบด้วย email และ password
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      console.log('🚀 Login mutation started');
      const response = await authService.login(data);

      console.log('📡 Login API response:', {
        success: response.success,
        hasData: !!response.data,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      return response.data;
    },
    onSuccess: async (data) => {
      console.log('✅ Login mutation onSuccess:', {
        hasToken: !!data.token,
        hasUser: !!data.user,
        username: data.user?.username,
      });

      // ⭐ Step 1: Store token first (basic user from Auth Service)
      console.log('🎯 Calling setAuth with basic user info...');
      setAuth(data.token, data.user);

      // ⭐ Step 2: Fetch complete profile from Backend Service
      try {
        console.log('📡 Fetching complete profile from Backend Service...');
        const profileResponse = await userService.getProfile();

        if (profileResponse.success && profileResponse.data) {
          console.log('✅ Complete profile fetched:', {
            username: profileResponse.data.username,
            hasBio: !!profileResponse.data.bio,
            hasKarma: profileResponse.data.karma !== undefined,
            followersCount: profileResponse.data.followersCount,
            followingCount: profileResponse.data.followingCount,
          });

          // Update Zustand with complete profile
          const setUser = useAuthStore.getState().setUser;
          setUser(profileResponse.data);

          console.log('✅ Zustand updated with complete profile');
        }
      } catch (error) {
        console.error('⚠️ Failed to fetch complete profile (using basic user):', error);
        // Continue with basic user info if profile fetch fails
      }

      // ตรวจสอบ localStorage ทันที
      setTimeout(() => {
        const stored = localStorage.getItem('auth-storage');
        console.log('💾 localStorage after login:', stored ? JSON.parse(stored) : 'EMPTY');
      }, 500);

      toast.success(TOAST_MESSAGES.AUTH.LOGIN_SUCCESS);
      router.push('/');
    },
    onError: (error: Error) => {
      console.error('❌ Login error:', error);
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_ERROR);
    },
  });
}

/**
 * Register mutation
 * ลงทะเบียนผู้ใช้ใหม่
 */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await authService.register(data);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.AUTH.REGISTER_SUCCESS);
      // Backend ไม่ return token, ต้อง redirect ไป login
      router.push('/login');
    },
    onError: (error: Error) => {
      toast.error(TOAST_MESSAGES.AUTH.REGISTER_ERROR);
    },
  });
}

/**
 * Logout mutation
 * ออกจากระบบ
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      // ⭐ 1. Cancel all ongoing queries first (ป้องกัน API call หลัง logout)
      await queryClient.cancelQueries();

      // ⭐ 2. Clear auth state (Zustand + localStorage + cookie)
      clearAuth();

      // ⭐ 3. Clear all React Query cache
      queryClient.clear();
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.AUTH.LOGOUT_SUCCESS);
      router.push('/login');
    },
  });
}

/**
 * Get Google OAuth URL
 * ดึง URL สำหรับ redirect ไป Google OAuth
 */
export function useGoogleOAuthUrl() {
  return useMutation({
    mutationFn: async () => {
      const response = await authService.getGoogleOAuthUrl();

      if (!response.success || !response.data?.url) {
        throw new Error('Failed to get Google OAuth URL');
      }

      return response.data.url;
    },
    onSuccess: (url) => {
      // Redirect to Google OAuth
      window.location.href = url;
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_ERROR);
    },
  });
}

/**
 * Handle Google OAuth Callback
 * จัดการ callback จาก Google OAuth
 */
export function useGoogleOAuthCallback() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      console.log('🔵 Google OAuth callback mutation started');
      console.log('🔵 Code:', code.substring(0, 20) + '...');
      console.log('🔵 State:', state);

      const response = await authService.handleGoogleOAuthCallback(code, state);

      console.log('📡 Google OAuth API response:', {
        success: response.success,
        hasData: !!response.data,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
      });

      if (!response.success || !response.data) {
        throw new Error('Google OAuth callback failed');
      }

      return response.data;
    },
    onSuccess: async (data) => {
      console.log('✅ Google OAuth callback onSuccess:', {
        hasToken: !!data.token,
        hasUser: !!data.user,
        username: data.user?.username,
        isNewUser: data.isNewUser,
        needsProfile: data.needsProfile,
      });

      // ⭐ Step 1: Store token first (basic user from Auth Service)
      console.log('🎯 Calling setAuth from Google OAuth...');
      setAuth(data.token, data.user);

      // ⭐ Step 2: Fetch complete profile from Backend Service (same as normal login)
      try {
        console.log('📡 Fetching complete profile from Backend Service (Google OAuth)...');
        const profileResponse = await userService.getProfile();

        if (profileResponse.success && profileResponse.data) {
          console.log('✅ Complete profile fetched (Google OAuth):', {
            username: profileResponse.data.username,
            hasBio: !!profileResponse.data.bio,
            hasKarma: profileResponse.data.karma !== undefined,
            followersCount: profileResponse.data.followersCount,
            followingCount: profileResponse.data.followingCount,
          });

          // Update Zustand with complete profile
          const setUser = useAuthStore.getState().setUser;
          setUser(profileResponse.data);

          console.log('✅ Zustand updated with complete profile (Google OAuth)');
        }
      } catch (error) {
        console.error('⚠️ Failed to fetch complete profile (Google OAuth, using basic user):', error);
        // Continue with basic user info if profile fetch fails
      }

      // ตรวจสอบ localStorage ทันที
      setTimeout(() => {
        const stored = localStorage.getItem('auth-storage');
        console.log('💾 localStorage after Google OAuth setAuth:', stored ? JSON.parse(stored) : 'EMPTY');
      }, 500);

      // Show success message
      if (data.isNewUser) {
        toast.success(TOAST_MESSAGES.AUTH.REGISTER_SUCCESS);
      } else {
        toast.success(TOAST_MESSAGES.AUTH.LOGIN_SUCCESS);
      }

      // Redirect
      if (data.needsProfile) {
        router.push('/profile/edit');
      } else {
        router.push('/');
      }
    },
    onError: (error) => {
      console.error('❌ Google OAuth callback error:', error);
      toast.error(TOAST_MESSAGES.AUTH.LOGIN_ERROR);
      router.push('/login');
    },
  });
}
