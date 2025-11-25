// ============================================================================
// User Service
// จัดการการเรียก API ที่เกี่ยวกับ User Profile Management
// ============================================================================

import { authService as authClient } from '@/lib/api/http-client'; // Auth Service (port 8088)
import apiService from '@/lib/api/http-client'; // Backend Service (port 8080)
import { API } from '@/lib/constants/api';
import type { UpdateProfileRequest } from '@/types/request';
import type {
  GetProfileResponse,
  GetUserProfileResponse,
  UpdateProfileResponse,
  DeleteUserResponse,
  ListUsersResponse,
} from '@/types/response';
import type { PaginationParams } from '@/types';

/**
 * User Service
 * จัดการการเรียก API ที่เกี่ยวกับการจัดการ User Profile
 */
const userService = {
  /**
   * ดึงข้อมูล profile ของผู้ใช้ปัจจุบัน (complete profile)
   * ใช้ Backend Service (port 8080)
   * GET /api/v1/users/me
   * @returns Promise<GetProfileResponse> - รวม bio, karma, followers/following
   */
  getProfile: async (): Promise<GetProfileResponse> => {
    return apiService.get<GetProfileResponse>(API.USER.ME);
  },

  /**
   * อัพเดทข้อมูล profile ทั้งหมด
   * ⭐ Backend Service (port 8080) รับทุก fields แล้ว
   * PATCH /api/v1/users/profile
   * @param data - displayName, avatar, bio, location, และ/หรือ website
   * @returns Promise<UpdateProfileResponse>
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return apiService.patch<UpdateProfileResponse>(API.USER.UPDATE_PROFILE, data);
  },

  /**
   * ลบบัญชีผู้ใช้
   * ใช้ Auth Service (port 8088)
   * @returns Promise<DeleteUserResponse>
   */
  deleteAccount: async (): Promise<DeleteUserResponse> => {
    return authClient.delete<DeleteUserResponse>(API.USER.DELETE_ACCOUNT);
  },

  /**
   * ดึงรายการผู้ใช้ทั้งหมด (Admin only)
   * ใช้ Backend Service (port 8080)
   * @param params - พารามิเตอร์สำหรับ pagination (offset, limit)
   * @returns Promise<ListUsersResponse>
   */
  listUsers: async (params?: PaginationParams): Promise<ListUsersResponse> => {
    return apiService.get<ListUsersResponse>(API.USER.LIST, params);
  },

  /**
   * ดึงข้อมูล profile ของผู้ใช้อื่น (Public API)
   * ใช้ Backend Service (port 8080)
   * @param username - username ของผู้ใช้ที่ต้องการดู
   * @returns Promise<GetUserProfileResponse> - รวม isFollowing ถ้า login อยู่
   */
  getUserProfile: async (username: string): Promise<GetUserProfileResponse> => {
    return apiService.get<GetUserProfileResponse>(API.PROFILE.GET_BY_USERNAME(username));
  },
};

export default userService;
