'use client';

import { useHydration } from '@/lib/hooks/useHydration';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly Component
 *
 * Wrapper component ที่ใช้แสดง content เฉพาะฝั่ง client เท่านั้น
 * ป้องกัน Hydration Mismatch Error เมื่อ content มีข้อมูลที่ต่างกันระหว่าง Server และ Client
 *
 * @param {React.ReactNode} children - Content ที่ต้องการแสดงเฉพาะฝั่ง client
 * @param {React.ReactNode} [fallback] - Content ที่แสดงตอน SSR (ถ้าไม่ระบุจะไม่แสดงอะไร)
 *
 * @example
 * ```tsx
 * <ClientOnly fallback={<LoadingSkeleton />}>
 *   <UserProfile user={user} />
 * </ClientOnly>
 * ```
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isMounted = useHydration();

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
