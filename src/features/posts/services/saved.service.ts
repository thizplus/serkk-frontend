// ============================================================================
// Saved Post Service
// จัดการการเรียก API ที่เกี่ยวกับ Saved/Bookmarked Posts
// ============================================================================


import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type { GetSavedPostsParams, GetSavedPostsCursorParams } from '@/types/request';
import type {
  SavePostResponse,
  UnsavePostResponse,
  GetSavedStatusResponse,
  GetSavedPostsResponse,
  GetSavedPostsCursorResponse,
} from '@/types/response';

/**
 * Saved Post Service
 * จัดการการเรียก API ที่เกี่ยวกับการบันทึก/บุ๊คมาร์คโพสต์
 */
const savedService = {
  /**
   * บันทึกโพสต์
   * @param postId - ID ของโพสต์ที่ต้องการบันทึก
   * @returns Promise<SavePostResponse>
   */
  save: async (postId: string): Promise<SavePostResponse> => {
    return apiService.post<SavePostResponse>(API.SAVED.SAVE(postId));
  },

  /**
   * ยกเลิกการบันทึกโพสต์
   * @param postId - ID ของโพสต์ที่ต้องการยกเลิกการบันทึก
   * @returns Promise<UnsavePostResponse>
   */
  unsave: async (postId: string): Promise<UnsavePostResponse> => {
    return apiService.delete<UnsavePostResponse>(API.SAVED.UNSAVE(postId));
  },

  /**
   * ตรวจสอบสถานะการบันทึกโพสต์
   * @param postId - ID ของโพสต์
   * @returns Promise<GetSavedStatusResponse>
   */
  getStatus: async (postId: string): Promise<GetSavedStatusResponse> => {
    return apiService.get<GetSavedStatusResponse>(API.SAVED.STATUS(postId));
  },

  /**
   * ดึงรายการโพสต์ที่บันทึกไว้ทั้งหมด (Cursor-based)
   * @param params - พารามิเตอร์ (cursor, limit)
   * @returns Promise<GetSavedPostsCursorResponse>
   */
  getSavedPosts: async (params?: GetSavedPostsCursorParams): Promise<GetSavedPostsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API.SAVED.LIST}?${queryString}` : API.SAVED.LIST;

    return apiService.get<GetSavedPostsCursorResponse>(url);
  },
};

export default savedService;
