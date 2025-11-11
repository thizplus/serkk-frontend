// ============================================================================
// Saved Post Service
// จัดการการเรียก API ที่เกี่ยวกับ Saved/Bookmarked Posts
// ============================================================================


import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type { GetSavedPostsParams } from '@/types/request';
import type {
  SavePostResponse,
  UnsavePostResponse,
  GetSavedStatusResponse,
  GetSavedPostsResponse,
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
   * ดึงรายการโพสต์ที่บันทึกไว้ทั้งหมด
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetSavedPostsResponse>
   */
  getSavedPosts: async (params?: GetSavedPostsParams): Promise<GetSavedPostsResponse> => {
    return apiService.get<GetSavedPostsResponse>(API.SAVED.LIST, params);
  },
};

export default savedService;
