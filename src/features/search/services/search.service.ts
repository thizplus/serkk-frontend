// ============================================================================
// Search Service
// จัดการการเรียก API ที่เกี่ยวกับ Search (การค้นหา)
// ============================================================================

import apiService from '@/shared/lib/api/http-client';
import { API } from '@/shared/lib/constants/api';
import type {
  SearchParams,
  GetPopularSearchesParams,
  GetSearchHistoryParams,
} from '@/shared/types/request';
import type {
  SearchResponse,
  GetPopularSearchesResponse,
  GetSearchHistoryResponse,
  ClearSearchHistoryResponse,
  DeleteSearchHistoryItemResponse,
} from '@/shared/types/response';

/**
 * Search Service
 * จัดการการเรียก API ที่เกี่ยวกับการค้นหาโพสต์, ผู้ใช้, แท็ก และประวัติการค้นหา
 */
const searchService = {
  /**
   * ค้นหาโพสต์, ผู้ใช้, และแท็ก
   * @param params - พารามิเตอร์การค้นหา (q, type, offset, limit)
   * @returns Promise<SearchResponse>
   */
  search: async (params: SearchParams): Promise<SearchResponse> => {
    return apiService.get<SearchResponse>(API.SEARCH.SEARCH, params);
  },

  /**
   * ดึงคำค้นหายอดนิยม
   * @param params - พารามิเตอร์ (limit)
   * @returns Promise<GetPopularSearchesResponse>
   */
  getPopular: async (
    params?: GetPopularSearchesParams
  ): Promise<GetPopularSearchesResponse> => {
    return apiService.get<GetPopularSearchesResponse>(API.SEARCH.POPULAR, params);
  },

  /**
   * ดึงประวัติการค้นหา
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetSearchHistoryResponse>
   */
  getHistory: async (
    params?: GetSearchHistoryParams
  ): Promise<GetSearchHistoryResponse> => {
    return apiService.get<GetSearchHistoryResponse>(API.SEARCH.HISTORY, params);
  },

  /**
   * ลบประวัติการค้นหาทั้งหมด
   * @returns Promise<ClearSearchHistoryResponse>
   */
  clearHistory: async (): Promise<ClearSearchHistoryResponse> => {
    return apiService.delete<ClearSearchHistoryResponse>(API.SEARCH.CLEAR_HISTORY);
  },

  /**
   * ลบประวัติการค้นหาเฉพาะรายการ
   * @param id - ID ของประวัติการค้นหา
   * @returns Promise<DeleteSearchHistoryItemResponse>
   */
  deleteHistoryItem: async (id: string): Promise<DeleteSearchHistoryItemResponse> => {
    return apiService.delete<DeleteSearchHistoryItemResponse>(API.SEARCH.DELETE_HISTORY_ITEM(id));
  },
};

export default searchService;
