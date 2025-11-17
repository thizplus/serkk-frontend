"use client";

// ============================================================================
// Search Queries
// React Query hooks สำหรับการค้นหา
// ============================================================================

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import searchService from '../services/search.service';
import type { SearchParams } from '@/types/request';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const searchKeys = {
  all: ['search'] as const,
  searches: () => [...searchKeys.all, 'queries'] as const,
  search: (params: SearchParams) => [...searchKeys.searches(), params] as const,
  popular: () => [...searchKeys.all, 'popular'] as const,
  history: () => [...searchKeys.all, 'history'] as const,
};

// ============================================================================
// QUERY: SEARCH
// ============================================================================

/**
 * Hook สำหรับค้นหาโพสต์, ผู้ใช้, และแท็ก (DEPRECATED - ใช้ useInfiniteSearch แทน)
 *
 * @param params - พารามิเตอร์การค้นหา (q, type, limit)
 * @param options - Query options
 * @returns Search results with posts, users, and tags
 *
 * @example
 * const { data, isLoading } = useSearch({
 *   q: 'react',
 *   type: 'all',
 *   limit: 20
 * }, { enabled: !!searchQuery });
 */
export function useSearch(
  params: SearchParams,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: searchKeys.search(params),
    queryFn: async () => {
      const response = await searchService.search(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search');
      }
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!params.q, // เปิดเมื่อมี query เท่านั้น
    staleTime: 1000 * 60 * 5, // Cache 5 นาที
  });
}

/**
 * Hook สำหรับค้นหาโพสต์ด้วย infinite scroll (Cursor-based pagination)
 *
 * @param params - พารามิเตอร์การค้นหา (q, limit)
 * @param options - Query options
 * @returns Infinite query results with posts only
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteSearch({
 *   q: 'react',
 *   limit: 20
 * }, { enabled: !!searchQuery });
 *
 * const posts = data?.pages.flatMap(page => page.posts) ?? [];
 */
export function useInfiniteSearch(
  params: Omit<SearchParams, 'cursor'>,
  options?: {
    enabled?: boolean;
  }
) {
  return useInfiniteQuery({
    queryKey: [...searchKeys.searches(), 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await searchService.search({
        ...params,
        cursor: pageParam,
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search');
      }
      return response.data;
    },
    getNextPageParam: (lastPage: any) => {
      // ใช้ hasMore และ nextCursor จาก backend (รอ backend implement)
      return lastPage.meta?.hasMore ? lastPage.meta?.nextCursor : undefined;
    },
    initialPageParam: undefined,
    enabled: options?.enabled !== undefined ? options.enabled : !!params.q,
    staleTime: 1000 * 60 * 5, // Cache 5 นาที
  });
}

/**
 * Hook สำหรับดึงคำค้นหายอดนิยม
 *
 * @example
 * const { data: popularSearches } = usePopularSearches({ limit: 10 });
 */
export function usePopularSearches(params?: { limit?: number }) {
  return useQuery({
    queryKey: searchKeys.popular(),
    queryFn: async () => {
      const response = await searchService.getPopular(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch popular searches');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // Cache 30 นาที
  });
}

/**
 * Hook สำหรับดึงประวัติการค้นหา
 *
 * @example
 * const { data: searchHistory } = useSearchHistory({ limit: 20 });
 */
export function useSearchHistory(params?: { offset?: number; limit?: number }) {
  return useQuery({
    queryKey: searchKeys.history(),
    queryFn: async () => {
      const response = await searchService.getHistory(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch search history');
      }
      return response.data;
    },
  });
}
