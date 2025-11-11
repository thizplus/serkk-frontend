'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGoogleOAuthCallback, useAuthStore } from '@/features/auth';
import userService from '@/features/profile/services/user.service';

export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessed = useRef(false);
  const googleOAuthCallback = useGoogleOAuthCallback();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Prevent double execution in development mode (React StrictMode)
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    console.log('🔵 OAuth Callback - Starting...');

    const token = searchParams.get('token');
    const isNewUser = searchParams.get('isNewUser') === 'true';

    if (!token) {
      // ⭐ ถ้าไม่มี token ใน query params แปลว่าต้องใช้ code + state flow
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      console.log('🔵 OAuth Callback - Code & State flow:', { hasCode: !!code, hasState: !!state });

      if (code && state) {
        // ⭐ กรณีนี้ useGoogleOAuthCallback จะเรียก setAuth ให้อัตโนมัติ
        console.log('🔵 OAuth Callback - Calling googleOAuthCallback.mutate...');
        googleOAuthCallback.mutate({ code, state });
      } else {
        console.error('❌ OAuth Callback - Missing code or state');
      }
      return;
    }

    // ⚠️ กรณีนี้ไม่ควรเกิด (deprecated flow)
    // แต่ถ้า backend redirect กลับมาพร้อม token ใน query params
    console.warn('⚠️ OAuth Callback - Direct token flow (deprecated)');
    console.log('🔵 Token received:', token.substring(0, 20) + '...');

    // ⭐ ปัญหา: เราไม่มี user data ในกรณีนี้!
    // Solution: ต้องเรียก API เพื่อดึง user profile
    const fetchUserAndSetAuth = async () => {
      try {
        console.log('🔵 Fetching user profile...');

        // Set token temporarily ใน localStorage เพื่อให้ API call ใช้งานได้
        localStorage.setItem('auth_token', token);

        // ⭐ ใช้ userService แทนการ fetch โดยตรง (จะใช้ http-client ที่มี baseURL ถูกต้อง)
        const response = await userService.getProfile();

        console.log('📡 Profile API response:', {
          success: response.success,
          hasData: !!response.data,
        });

        if (response.success && response.data) {
          console.log('✅ User profile fetched:', response.data.username);
          // ⭐ ใช้ Zustand setAuth
          setAuth(token, response.data);

          // ตรวจสอบ localStorage
          setTimeout(() => {
            const stored = localStorage.getItem('auth-storage');
            console.log('💾 localStorage after setAuth:', stored ? JSON.parse(stored) : 'EMPTY');
          }, 500);

          router.push('/');
        } else {
          console.error('❌ Failed to fetch user profile');
          router.push('/login');
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        router.push('/login');
      }
    };

    fetchUserAndSetAuth();
  }, [searchParams, googleOAuthCallback, setAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
        </div>
        <h2 className="text-xl font-semibold">กำลังเข้าสู่ระบบ...</h2>
        <p className="mt-2 text-gray-600">
          กรุณารอสักครู่ ระบบกำลังดำเนินการ
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
          </div>
          <h2 className="text-xl font-semibold">กำลังเข้าสู่ระบบ...</h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
