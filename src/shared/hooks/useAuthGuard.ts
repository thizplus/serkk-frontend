"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/features/auth";

/**
 * useAuthGuard Hook
 *
 * ใช้ตรวจสอบว่า user login แล้วหรือยัง
 * ถ้ายัง → แสดง toast และ redirect ไป /login
 *
 * @example
 * const { requireAuth, isAuthenticated } = useAuthGuard();
 *
 * const handleVote = () => {
 *   if (!requireAuth('โหวต')) return;
 *   // ... vote logic
 * };
 */
export function useAuthGuard() {
  const user = useUser();
  const router = useRouter();

  /**
   * Require authentication to perform an action
   *
   * @param action - ชื่อ action ที่ต้องการทำ (เช่น 'โหวต', 'แสดงความคิดเห็น')
   * @returns true if authenticated, false if not
   */
  const requireAuth = (action: string = 'ทำการกระทำนี้'): boolean => {
    if (!user) {
      toast.error(`กรุณาล็อกอินเพื่อ${action}`, {
        description: 'คุณต้องเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้',
        action: {
          label: 'ล็อกอิน',
          onClick: () => router.push('/login'),
        },
      });

      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 1500);

      return false;
    }
    return true;
  };

  return {
    requireAuth,
    isAuthenticated: !!user,
  };
}
