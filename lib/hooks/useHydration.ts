import { useState, useEffect } from 'react';

/**
 * useHydration Hook
 *
 * ใช้สำหรับป้องกัน Hydration Mismatch Error
 * เมื่อมีการใช้ข้อมูลที่ต่างกันระหว่าง Server-Side และ Client-Side
 * เช่น localStorage, window, document.cookie
 *
 * @returns {boolean} isMounted - คืนค่า true เมื่อ component ถูก mount แล้วบน client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMounted = useHydration();
 *
 *   if (!isMounted) {
 *     return <LoadingSkeleton />; // แสดงเหมือนกับ server-side
 *   }
 *
 *   return <ActualContent />; // แสดงเมื่อ hydration เสร็จแล้ว
 * }
 * ```
 */
export function useHydration(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
