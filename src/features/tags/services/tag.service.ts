// ============================================================================
// Tag Service
// จัดการการเรียก API ที่เกี่ยวกับ Tags (แท็ก)
// ============================================================================

import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type {
  GetTagsParams,
  GetPopularTagsParams,
  SearchTagsParams,
} from '@/types/request';
import type {
  GetTagResponse,
  ListTagsResponse,
  GetPopularTagsResponse,
  SearchTagsResponse,
} from '@/types/response';

/**
 * Tag Service
 * จัดการการเรียก API ที่เกี่ยวกับแท็กและการค้นหาแท็ก
 */
const tagService = {
  /**
   * ดึงข้อมูลแท็กตาม ID
   * @param id - ID ของแท็ก
   * @returns Promise<GetTagResponse>
   */
  getById: async (id: string): Promise<GetTagResponse> => {
    return apiService.get<GetTagResponse>(API.TAG.GET_BY_ID(id));
  },

  /**
   * ดึงข้อมูลแท็กตามชื่อ
   * @param name - ชื่อของแท็ก
   * @returns Promise<GetTagResponse>
   */
  getByName: async (name: string): Promise<GetTagResponse> => {
    return apiService.get<GetTagResponse>(API.TAG.GET_BY_NAME(name));
  },

  /**
   * ดึงรายการแท็กทั้งหมด
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<ListTagsResponse>
   */
  list: async (params?: GetTagsParams): Promise<ListTagsResponse> => {
    return apiService.get<ListTagsResponse>(API.TAG.LIST, params);
  },

  /**
   * ดึงแท็กยอดนิยม
   * @param params - พารามิเตอร์ (limit)
   * @returns Promise<GetPopularTagsResponse>
   */
  getPopular: async (params?: GetPopularTagsParams): Promise<GetPopularTagsResponse> => {
    return apiService.get<GetPopularTagsResponse>(API.TAG.POPULAR, params);
  },

  /**
   * ค้นหาแท็ก
   * @param params - พารามิเตอร์การค้นหา (q)
   * @returns Promise<SearchTagsResponse>
   */
  search: async (params: SearchTagsParams): Promise<SearchTagsResponse> => {
    return apiService.get<SearchTagsResponse>(API.TAG.SEARCH, params);
  },
};

export default tagService;
