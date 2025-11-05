// ============================================================================
// User Service
// จัดการการเรียก API ที่เกี่ยวกับ User Profile Management
// ============================================================================

import apiService from '../http-client';
import { API } from '@/lib/constants/api';
import type { UpdateProfileRequest } from '@/lib/types/request';
import type {
  GetProfileResponse,
  GetUserProfileResponse,
  UpdateProfileResponse,
  DeleteUserResponse,
  ListUsersResponse,
} from '@/lib/types/response';
import type { PaginationParams } from '@/lib/types';

/**
 * User Service
 * จัดการการเรียก API ที่เกี่ยวกับการจัดการ User Profile
 */
const userService = {
  /**
   * ดึงข้อมูล profile ของผู้ใช้ปัจจุบัน
   * @returns Promise<GetProfileResponse>
   */
  getProfile: async (): Promise<GetProfileResponse> => {
    return apiService.get<GetProfileResponse>(API.USER.PROFILE);
  },

  /**
   * อัพเดทข้อมูล profile ของผู้ใช้ปัจจุบัน
   * @param data - ข้อมูลที่ต้องการอัพเดท (displayName, bio, avatar, etc.)
   * @returns Promise<UpdateProfileResponse>
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return apiService.put<UpdateProfileResponse>(API.USER.UPDATE_PROFILE, data);
  },

  /**
   * ลบบัญชีผู้ใช้
   * @returns Promise<DeleteUserResponse>
   */
  deleteAccount: async (): Promise<DeleteUserResponse> => {
    return apiService.delete<DeleteUserResponse>(API.USER.DELETE_ACCOUNT);
  },

  /**
   * ดึงรายการผู้ใช้ทั้งหมด (Admin only)
   * @param params - พารามิเตอร์สำหรับ pagination (offset, limit)
   * @returns Promise<ListUsersResponse>
   */
  listUsers: async (params?: PaginationParams): Promise<ListUsersResponse> => {
    return apiService.get<ListUsersResponse>(API.USER.LIST, params);
  },

  /**
   * ดึงข้อมูล profile ของผู้ใช้อื่น (Public API)
   * @param username - username ของผู้ใช้ที่ต้องการดู
   * @returns Promise<GetUserProfileResponse> - รวม isFollowing ถ้า login อยู่
   */
  getUserProfile: async (username: string): Promise<GetUserProfileResponse> => {
    return apiService.get<GetUserProfileResponse>(API.PROFILE.GET_BY_USERNAME(username));
  },
};

export default userService;
