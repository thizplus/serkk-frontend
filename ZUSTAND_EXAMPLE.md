# ตัวอย่างการใช้ Zustand แก้ปัญหา Hydration Error

## 📦 Installation

```bash
npm install zustand
```

## 🎯 สร้าง Auth Store ด้วย Zustand

```typescript
// lib/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types/models';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean; // flag สำหรับเช็คว่า hydrate เสร็จแล้วหรือยัง

  // Actions
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
      }),

      clearAuth: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
      }),

      setHasHydrated: (state) => set({
        _hasHydrated: state,
      }),
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),

      // ⭐ สำคัญ! จัดการ hydration
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },

      // เลือกเฉพาะ field ที่ต้องการเก็บ
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Hook สำหรับเช็ค hydration state
export const useHasHydrated = () => {
  return useAuthStore((state) => state._hasHydrated);
};
```

## 🔧 ใช้งานใน Component

### วิธีที่ 1: ใช้ hasHydrated flag

```typescript
// components/nav-user.tsx
'use client';

import { useAuthStore, useHasHydrated } from '@/lib/stores/authStore';

export function NavUser() {
  const hasHydrated = useHasHydrated();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // ⭐ แสดง loading จนกว่า hydration จะเสร็จ
  if (!hasHydrated) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <p>{user.displayName}</p>
      <button onClick={clearAuth}>Logout</button>
    </div>
  );
}
```

### วิธีที่ 2: ใช้ ClientOnly Component (แนะนำ)

```typescript
// components/nav-user.tsx
'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { ClientOnly } from '@/components/ClientOnly';

export function NavUser() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <ClientOnly fallback={<LoadingSkeleton />}>
      {user ? (
        <div>
          <p>{user.displayName}</p>
          <button onClick={clearAuth}>Logout</button>
        </div>
      ) : null}
    </ClientOnly>
  );
}
```

## 🎨 Login/Logout Actions

```typescript
// lib/hooks/mutations/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/authStore';
import authService from '@/lib/services/api/auth.service';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // บันทึก token และ user ลง Zustand store
      // Zustand จะ sync ไปที่ localStorage อัตโนมัติ
      setAuth(data.token, data.user);
      toast.success('เข้าสู่ระบบสำเร็จ!');
      router.push('/');
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      // Zustand จะลบ localStorage อัตโนมัติ
      clearAuth();
    },
    onSuccess: () => {
      toast.success('ออกจากระบบแล้ว');
      router.push('/login');
    },
  });
}
```

## ✅ ข้อดีของ Zustand

1. **Hydration Management:** มี `_hasHydrated` flag และ `onRehydrateStorage` callback
2. **Automatic Persistence:** sync กับ localStorage อัตโนมัติ
3. **No Provider Hell:** ไม่ต้อง wrap ด้วย Provider
4. **Better Performance:** Re-render เฉพาะ component ที่ใช้ state นั้นๆ
5. **Type Safety:** รองรับ TypeScript เต็มรูปแบบ
6. **DevTools:** มี Zustand DevTools สำหรับ debug

## ⚠️ ข้อควรระวัง

1. ยังคงต้องใช้ `ClientOnly` หรือ check `hasHydrated` ในบาง case
2. ต้อง setup persist middleware ให้ถูกต้อง
3. ถ้าใช้ SSR/SSG ต้องระวังเรื่อง initial state

## 🔄 Migration Path

ถ้าอยากเปลี่ยนจาก Context API → Zustand:

1. สร้าง auth store (ดูตัวอย่างข้างบน)
2. แทนที่ `useAuth()` ด้วย `useAuthStore()`
3. ลบ AuthProvider ออกจาก layout.tsx
4. ลบ AuthContext.tsx
5. อัปเดต components ที่ใช้ auth

## 🎯 คำตอบคำถาม: Zustand แก้ปัญหา Hydration Error ได้ไหม?

**คำตอบ:** ใช่ แต่ไม่ใช่แบบ magic!

- Zustand **ไม่ได้กำจัด** hydration error โดยอัตโนมัติ
- แต่มัน**จัดการให้ง่ายกว่า** ด้วย built-in tools
- ยังคงต้องใช้ `hasHydrated` check หรือ `ClientOnly` wrapper
- **ข้อดีหลัก:** Clean code, Better DX, Auto sync localStorage

## 🤔 ควรใช้ Zustand ไหม?

**ใช่ ถ้า:**
- โปรเจกต์มี state management ที่ซับซ้อน
- ต้องการ performance ที่ดีกว่า Context API
- ต้องการ persist state หลายๆ ตัว

**ไม่ใช้ ถ้า:**
- โปรเจกต์เล็ก auth state เดียว
- ทีมไม่คุ้นเคยกับ Zustand
- Solution ปัจจุบันใช้งานได้ดีอยู่แล้ว
