// ============================================================================
// Comment Service
// จัดการการเรียก API ที่เกี่ยวกับ Comments (CRUD, Nested Replies, Tree)
// ============================================================================

import apiService from '../http-client';
import { API } from '@/lib/constants/api';
import type {
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsParams,
  GetCommentTreeParams,
} from '@/lib/types/request';
import type {
  CreateCommentResponse,
  GetCommentResponse,
  UpdateCommentResponse,
  DeleteCommentResponse,
  ListCommentsResponse,
  ListCommentsByAuthorResponse,
  GetCommentRepliesResponse,
  GetCommentTreeResponse,
  GetCommentParentChainResponse,
} from '@/lib/types/response';

/**
 * Comment Service
 * จัดการการเรียก API ที่เกี่ยวกับ Comments และ Replies
 */
const commentService = {
  /**
   * สร้างคอมเมนต์ใหม่หรือตอบกลับคอมเมนต์
   * @param data - ข้อมูลคอมเมนต์ (postId, content, parentId)
   * @returns Promise<CreateCommentResponse>
   */
  create: async (data: CreateCommentRequest): Promise<CreateCommentResponse> => {
    return apiService.post<CreateCommentResponse>(API.COMMENT.CREATE, data);
  },

  /**
   * ดึงข้อมูลคอมเมนต์ตาม ID
   * @param id - ID ของคอมเมนต์
   * @returns Promise<GetCommentResponse>
   */
  getById: async (id: string): Promise<GetCommentResponse> => {
    return apiService.get<GetCommentResponse>(API.COMMENT.GET_BY_ID(id));
  },

  /**
   * อัพเดทคอมเมนต์
   * @param id - ID ของคอมเมนต์
   * @param data - ข้อมูลที่ต้องการอัพเดท (content)
   * @returns Promise<UpdateCommentResponse>
   */
  update: async (id: string, data: UpdateCommentRequest): Promise<UpdateCommentResponse> => {
    return apiService.put<UpdateCommentResponse>(API.COMMENT.UPDATE(id), data);
  },

  /**
   * ลบคอมเมนต์
   * @param id - ID ของคอมเมนต์
   * @returns Promise<DeleteCommentResponse>
   */
  delete: async (id: string): Promise<DeleteCommentResponse> => {
    return apiService.delete<DeleteCommentResponse>(API.COMMENT.DELETE(id));
  },

  /**
   * ดึงคอมเมนต์ทั้งหมดของโพสต์
   * @param postId - ID ของโพสต์
   * @param params - พารามิเตอร์ (sortBy, offset, limit)
   * @returns Promise<ListCommentsResponse>
   */
  getByPostId: async (postId: string, params?: GetCommentsParams): Promise<ListCommentsResponse> => {
    return apiService.get<ListCommentsResponse>(API.COMMENT.BY_POST(postId), params);
  },

  /**
   * ดึงคอมเมนต์ทั้งหมดของผู้เขียนคนใดคนหนึ่ง
   * @param userId - ID ของผู้เขียน
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<ListCommentsByAuthorResponse>
   */
  getByAuthor: async (
    userId: string,
    params?: GetCommentsParams
  ): Promise<ListCommentsByAuthorResponse> => {
    return apiService.get<ListCommentsByAuthorResponse>(API.COMMENT.BY_AUTHOR(userId), params);
  },

  /**
   * ดึงคำตอบโดยตรงของคอมเมนต์
   * @param commentId - ID ของคอมเมนต์
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetCommentRepliesResponse>
   */
  getReplies: async (
    commentId: string,
    params?: GetCommentsParams
  ): Promise<GetCommentRepliesResponse> => {
    return apiService.get<GetCommentRepliesResponse>(API.COMMENT.REPLIES(commentId), params);
  },

  /**
   * ดึง comment tree ของทั้ง post (nested replies) แบบเต็ม
   * @param postId - ID ของโพสต์
   * @param params - พารามิเตอร์ (maxDepth)
   * @returns Promise<GetCommentTreeResponse>
   */
  getPostTree: async (
    postId: string,
    params?: GetCommentTreeParams
  ): Promise<GetCommentTreeResponse> => {
    return apiService.get<GetCommentTreeResponse>(API.COMMENT.POST_TREE(postId), params);
  },

  /**
   * ดึง comment tree (nested replies) แบบเต็ม
   * @param commentId - ID ของคอมเมนต์
   * @param params - พารามิเตอร์ (maxDepth)
   * @returns Promise<GetCommentTreeResponse>
   */
  getTree: async (
    commentId: string,
    params?: GetCommentTreeParams
  ): Promise<GetCommentTreeResponse> => {
    return apiService.get<GetCommentTreeResponse>(API.COMMENT.TREE(commentId), params);
  },

  /**
   * ดึง parent chain ของคอมเมนต์ (เส้นทางจาก root ถึง comment นี้)
   * @param commentId - ID ของคอมเมนต์
   * @returns Promise<GetCommentParentChainResponse>
   */
  getParentChain: async (commentId: string): Promise<GetCommentParentChainResponse> => {
    return apiService.get<GetCommentParentChainResponse>(API.COMMENT.PARENT_CHAIN(commentId));
  },
};

export default commentService;
