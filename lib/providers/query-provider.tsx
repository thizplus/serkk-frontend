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
            // ตั้งค่า default สำหรับทุก queries
            staleTime: 60 * 1000, // 1 minute - ข้อมูลจะถือว่า "stale" หลัง 1 นาที
            gcTime: 5 * 60 * 1000, // 5 minutes - เก็บข้อมูลใน cache 5 นาที
            refetchOnWindowFocus: false, // ไม่ refetch เมื่อ focus window
            refetchOnMount: false, // ไม่ refetch เมื่อ component mount ถ้ามีข้อมูลใน cache อยู่แล้ว
            retry: false, // ไม่ retry เมื่อ error
          },
          mutations: {
            retry: 0, // ไม่ retry mutations
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
