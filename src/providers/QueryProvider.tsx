'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ Optimized defaults สำหรับ UX ที่ดี
            staleTime: 30 * 1000, // 30 วินาที - ข้อมูลเก่าหลัง 30s
            gcTime: 5 * 60 * 1000, // 5 minutes - เก็บ cache 5 นาที
            refetchOnWindowFocus: true, // ✅ Refetch เมื่อกลับมาที่หน้าต่าง (เห็นข้อมูลใหม่)
            refetchOnMount: true, // ✅ Refetch เมื่อ mount component (ข้อมูลล่าสุด)
            retry: 1, // Retry 1 ครั้งกรณี network error
            retryDelay: 1000, // Delay 1 วินาทีก่อน retry
          },
          mutations: {
            retry: 0, // ไม่ retry mutations (user action ควรชัดเจน)
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - แสดงแค่ใน development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
