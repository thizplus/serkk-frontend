import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/models';

interface AuthState {
  // State
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean; // Internal flag สำหรับเช็คว่า hydrate เสร็จแล้วหรือยัง

  // Actions
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setHasHydrated: (state: boolean) => void;
}

/**
 * Auth Store ด้วย Zustand
 *
 * จัดการ authentication state ทั้งหมด
 * รองรับ localStorage persistence และ hydration
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // Set authentication (login)
      setAuth: (token, user) => {
        console.log('🔐 setAuth called:', { token: token?.substring(0, 20) + '...', user: user?.username });

        set({
          token,
          user,
          isAuthenticated: true,
        });

        // เก็บ token ใน localStorage สำหรับ http-client
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }

        // เก็บ cookie สำหรับ middleware
        if (typeof document !== 'undefined') {
          document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7 days
          console.log('🍪 Cookie set');
        }

        // Log state after set
        setTimeout(() => {
          const state = get();
          console.log('✅ State after setAuth:', {
            hasToken: !!state.token,
            hasUser: !!state.user,
            isAuthenticated: state.isAuthenticated,
          });
        }, 100);
      },

      // Clear authentication (logout)
      clearAuth: () => {
        console.log('🚪 clearAuth called');

        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });

        // ลบ token จาก localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }

        // ลบ cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'auth_token=; path=/; max-age=0';
          console.log('🍪 Cookie cleared');
        }
      },

      // Update user data
      setUser: (user) => {
        set({ user });
      },

      // Set hydration state
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage', // localStorage key

      // ⭐ สำคัญ: ใช้ storage แบบ safe สำหรับ SSR
      storage: createJSONStorage(() => {
        // ตรวจสอบว่ามี localStorage หรือไม่
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),

      // ⭐ จัดการ hydration - เรียกเมื่อ state ถูก restore จาก localStorage
      onRehydrateStorage: () => {
        console.log('💧 Starting hydration...');

        return (state, error) => {
          if (error) {
            console.error('❌ Hydration error:', error);
            return;
          }

          console.log('💧 Hydration complete:', {
            hasToken: !!state?.token,
            hasUser: !!state?.user,
            isAuthenticated: state?.isAuthenticated,
          });

          // เมื่อ hydrate เสร็จ set flag เป็น true
          state?.setHasHydrated(true);

          // Sync token กับ localStorage และ cookie
          if (state?.token) {
            // Sync auth_token สำหรับ http-client (backward compatibility)
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_token', state.token);
            }

            // Sync cookie
            if (typeof document !== 'undefined') {
              document.cookie = `auth_token=${state.token}; path=/; max-age=604800`;
            }
          }
        };
      },

      // เลือกเฉพาะ field ที่ต้องการเก็บใน localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),

      // ⭐ เพิ่ม version สำหรับ migration ในอนาคต
      version: 1,
    }
  )
);

/**
 * Hook สำหรับเช็คว่า store ได้ hydrate เสร็จแล้วหรือยัง
 * ใช้สำหรับป้องกัน Hydration Mismatch Error
 *
 * @returns {boolean} hasHydrated - true เมื่อ hydration เสร็จแล้ว
 */
export const useHasHydrated = () => {
  return useAuthStore((state) => state._hasHydrated);
};

/**
 * Hook สำหรับดึง user data
 */
export const useUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Hook สำหรับเช็คว่า user login หรือยัง
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated);
};

/**
 * Hook สำหรับดึง token
 */
export const useToken = () => {
  return useAuthStore((state) => state.token);
};
