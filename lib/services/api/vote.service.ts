// ============================================================================
// Vote Service
// จัดการการเรียก API ที่เกี่ยวกับ Voting (Upvote/Downvote)
// ============================================================================

import apiService from '../http-client';
import { API } from '@/lib/constants/api';
import type { VoteRequest, GetUserVotesParams } from '@/lib/types/request';
import type {
  VoteResponse,
  UnvoteResponse,
  GetVoteResponse,
  GetVoteCountResponse,
  GetUserVotesResponse,
} from '@/lib/types/response';
import type { TargetType } from '@/lib/types';

/**
 * Vote Service
 * จัดการการเรียก API ที่เกี่ยวกับการโหวต (upvote/downvote) ของโพสต์และคอมเมนต์
 */
const voteService = {
  /**
   * โหวตโพสต์หรือคอมเมนต์
   * @param data - ข้อมูลการโหวต (targetId, targetType, voteType: "up"/"down")
   * @returns Promise<VoteResponse>
   */
  vote: async (data: VoteRequest): Promise<VoteResponse> => {
    return apiService.post<VoteResponse>(API.VOTE.CREATE, data);
  },

  /**
   * ยกเลิกการโหวต
   * @param targetType - ประเภท (post หรือ comment)
   * @param targetId - ID ของโพสต์หรือคอมเมนต์
   * @returns Promise<UnvoteResponse>
   */
  unvote: async (targetType: TargetType, targetId: string): Promise<UnvoteResponse> => {
    return apiService.delete<UnvoteResponse>(API.VOTE.DELETE(targetType, targetId));
  },

  /**
   * ดึงข้อมูลการโหวตของผู้ใช้ปัจจุบัน
   * @param targetType - ประเภท (post หรือ comment)
   * @param targetId - ID ของโพสต์หรือคอมเมนต์
   * @returns Promise<GetVoteResponse>
   */
  getUserVote: async (targetType: TargetType, targetId: string): Promise<GetVoteResponse> => {
    return apiService.get<GetVoteResponse>(API.VOTE.GET(targetType, targetId));
  },

  /**
   * ดึงจำนวนโหวตทั้งหมด
   * @param targetType - ประเภท (post หรือ comment)
   * @param targetId - ID ของโพสต์หรือคอมเมนต์
   * @returns Promise<GetVoteCountResponse>
   */
  getCount: async (targetType: TargetType, targetId: string): Promise<GetVoteCountResponse> => {
    return apiService.get<GetVoteCountResponse>(API.VOTE.GET_COUNT(targetType, targetId));
  },

  /**
   * ดึงประวัติการโหวตของผู้ใช้ปัจจุบัน
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetUserVotesResponse>
   */
  getUserVotes: async (params?: GetUserVotesParams): Promise<GetUserVotesResponse> => {
    return apiService.get<GetUserVotesResponse>(API.VOTE.GET_USER_VOTES, params);
  },
};

export default voteService;
