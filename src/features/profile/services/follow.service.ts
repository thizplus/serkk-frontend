// ============================================================================
// Follow Service
// จัดการการเรียก API ที่เกี่ยวกับ Follow System (ติดตาม/เลิกติดตาม)
// ============================================================================

import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type {
  GetFollowersParams,
  GetFollowersCursorParams,
  GetFollowingParams,
  GetFollowingCursorParams,
  GetMutualFollowsParams,
  GetMutualFollowsCursorParams,
} from '@/types/request';
import type {
  FollowUserResponse,
  UnfollowUserResponse,
  GetFollowStatusResponse,
  GetFollowersResponse,
  GetFollowersCursorResponse,
  GetFollowingResponse,
  GetFollowingCursorResponse,
  GetMutualFollowsResponse,
  GetMutualFollowsCursorResponse,
} from '@/types/response';

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
   * ดึงรายชื่อผู้ติดตามของผู้ใช้ (Cursor-based)
   * @param userId - ID ของผู้ใช้
   * @param params - พารามิเตอร์ (cursor, limit)
   * @returns Promise<GetFollowersCursorResponse>
   */
  getFollowers: async (
    userId: string,
    params?: GetFollowersCursorParams
  ): Promise<GetFollowersCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API.FOLLOW.FOLLOWERS(userId)}?${queryString}` : API.FOLLOW.FOLLOWERS(userId);

    return apiService.get<GetFollowersCursorResponse>(url);
  },

  /**
   * ดึงรายชื่อผู้ใช้ที่กำลังติดตาม (Cursor-based)
   * @param userId - ID ของผู้ใช้
   * @param params - พารามิเตอร์ (cursor, limit)
   * @returns Promise<GetFollowingCursorResponse>
   */
  getFollowing: async (
    userId: string,
    params?: GetFollowingCursorParams
  ): Promise<GetFollowingCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API.FOLLOW.FOLLOWING(userId)}?${queryString}` : API.FOLLOW.FOLLOWING(userId);

    return apiService.get<GetFollowingCursorResponse>(url);
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
