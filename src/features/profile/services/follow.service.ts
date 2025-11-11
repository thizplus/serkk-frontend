// ============================================================================
// Follow Service
// จัดการการเรียก API ที่เกี่ยวกับ Follow System (ติดตาม/เลิกติดตาม)
// ============================================================================

import apiService from '@/shared/lib/api/http-client';
import { API } from '@/shared/lib/constants/api';
import type {
  GetFollowersParams,
  GetFollowingParams,
  GetMutualFollowsParams,
} from '@/shared/types/request';
import type {
  FollowUserResponse,
  UnfollowUserResponse,
  GetFollowStatusResponse,
  GetFollowersResponse,
  GetFollowingResponse,
  GetMutualFollowsResponse,
} from '@/shared/types/response';

/**
 * Follow Service
 * จัดการการเรียก API ที่เกี่ยวกับระบบการติดตามผู้ใช้
 */
const followService = {
  /**
   * ติดตามผู้ใช้
   * @param userId - ID ของผู้ใช้ที่ต้องการติดตาม
   * @returns Promise<FollowUserResponse>
   */
  follow: async (userId: string): Promise<FollowUserResponse> => {
    return apiService.post<FollowUserResponse>(API.FOLLOW.FOLLOW(userId));
  },

  /**
   * เลิกติดตามผู้ใช้
   * @param userId - ID ของผู้ใช้ที่ต้องการเลิกติดตาม
   * @returns Promise<UnfollowUserResponse>
   */
  unfollow: async (userId: string): Promise<UnfollowUserResponse> => {
    return apiService.delete<UnfollowUserResponse>(API.FOLLOW.UNFOLLOW(userId));
  },

  /**
   * ตรวจสอบสถานะการติดตาม
   * @param userId - ID ของผู้ใช้
   * @returns Promise<GetFollowStatusResponse>
   */
  getStatus: async (userId: string): Promise<GetFollowStatusResponse> => {
    return apiService.get<GetFollowStatusResponse>(API.FOLLOW.STATUS(userId));
  },

  /**
   * ดึงรายชื่อผู้ติดตามของผู้ใช้
   * @param userId - ID ของผู้ใช้
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetFollowersResponse>
   */
  getFollowers: async (
    userId: string,
    params?: GetFollowersParams
  ): Promise<GetFollowersResponse> => {
    return apiService.get<GetFollowersResponse>(API.FOLLOW.FOLLOWERS(userId), params);
  },

  /**
   * ดึงรายชื่อผู้ใช้ที่กำลังติดตาม
   * @param userId - ID ของผู้ใช้
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetFollowingResponse>
   */
  getFollowing: async (
    userId: string,
    params?: GetFollowingParams
  ): Promise<GetFollowingResponse> => {
    return apiService.get<GetFollowingResponse>(API.FOLLOW.FOLLOWING(userId), params);
  },

  /**
   * ดึงรายชื่อเพื่อนร่วมกัน (mutual follows)
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetMutualFollowsResponse>
   */
  getMutualFollows: async (
    params?: GetMutualFollowsParams
  ): Promise<GetMutualFollowsResponse> => {
    return apiService.get<GetMutualFollowsResponse>(API.FOLLOW.MUTUALS, params);
  },
};

export default followService;
