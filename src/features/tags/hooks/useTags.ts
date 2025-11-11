"use client";

// ============================================================================
// Tag Queries
// React Query hooks สำหรับดึงข้อมูล Tags
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import tagService from '../services/tag.service';
import type { GetTagsParams, GetPopularTagsParams, SearchTagsParams } from '@/shared/types/request';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (params?: GetTagsParams) => [...tagKeys.lists(), params] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
  byName: (name: string) => [...tagKeys.all, 'name', name] as const,
  popular: (params?: GetPopularTagsParams) => [...tagKeys.all, 'popular', params] as const,
  search: (params?: SearchTagsParams) => [...tagKeys.all, 'search', params] as const,
};

// ============================================================================
// QUERY: GET TAG BY ID
// ============================================================================

/**
 * Hook สำหรับดึงข้อมูล tag ตาม ID
 *
 * @param id - Tag ID
 * @param options - Query options (enabled)
 */
export function useTag(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await tagService.getById(id);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch tag');
        }
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching tag:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// QUERY: GET TAG BY NAME
// ============================================================================

/**
 * Hook สำหรับดึงข้อมูล tag ตามชื่อ
 * ใช้สำหรับแปลง tag name → tag object (พร้อม id)
 *
 * @param name - Tag name
 * @param options - Query options (enabled)
 *
 * @example
 * ```tsx
 * const { data: tag } = useTagByName('javascript');
 * console.log(tag?.id); // "ea3084b2-982d-4975-ad7b-97b68a587caf"
 * ```
 */
export function useTagByName(name: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tagKeys.byName(name),
    queryFn: async () => {
      try {
        const response = await tagService.getByName(name);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch tag');
        }
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching tag by name:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes - tag data ไม่เปลี่ยนบ่อย
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// QUERY: GET TAGS LIST
// ============================================================================

/**
 * Hook สำหรับดึงรายการ tags ทั้งหมด
 *
 * @param params - Pagination parameters (offset, limit)
 */
export function useTags(params?: GetTagsParams) {
  return useQuery({
    queryKey: tagKeys.list(params),
    queryFn: async () => {
      try {
        const response = await tagService.list(params);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch tags');
        }
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching tags:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// QUERY: GET POPULAR TAGS
// ============================================================================

/**
 * Hook สำหรับดึง popular tags
 *
 * @param params - Parameters (limit)
 */
export function usePopularTags(params?: GetPopularTagsParams) {
  return useQuery({
    queryKey: tagKeys.popular(params),
    queryFn: async () => {
      try {
        const response = await tagService.getPopular(params);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch popular tags');
        }
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching popular tags:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ============================================================================
// QUERY: SEARCH TAGS
// ============================================================================

/**
 * Hook สำหรับค้นหา tags
 *
 * @param params - Search parameters (q)
 */
export function useSearchTags(params: SearchTagsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tagKeys.search(params),
    queryFn: async () => {
      try {
        const response = await tagService.search(params);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to search tags');
        }
        return response.data;
      } catch (error) {
        console.error('❌ Error searching tags:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!params.q,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
