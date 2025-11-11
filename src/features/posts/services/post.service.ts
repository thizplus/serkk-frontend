// ============================================================================
// Post Service
// จัดการการเรียก API ที่เกี่ยวกับ Posts (CRUD, Feed, Crosspost)
// ============================================================================


import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type {
  CreatePostRequest,
  UpdatePostRequest,
  GetPostsParams,
  SearchPostsParams,
  CreateCrosspostRequest,
} from '@/types/request';
import type {
  CreatePostResponse,
  GetPostResponse,
  UpdatePostResponse,
  DeletePostResponse,
  ListPostsResponse,
  SearchPostsResponse,
  CreateCrosspostResponse,
  GetCrosspostsResponse,
  GetFeedResponse,
} from '@/types/response';

/**
 * Post Service
 * จัดการการเรียก API ที่เกี่ยวกับ Posts, Feed, และ Crosspost
 */
const postService = {
  /**
   * สร้างโพสต์ใหม่
   * @param data - ข้อมูลโพสต์ (title, content, tags, mediaIds)
   * @returns Promise<CreatePostResponse>
   */
  create: async (data: CreatePostRequest): Promise<CreatePostResponse> => {
    return apiService.post<CreatePostResponse>(API.POST.CREATE, data);
  },

  /**
   * ดึงข้อมูลโพสต์ตาม ID
   * @param id - ID ของโพสต์
   * @returns Promise<GetPostResponse>
   */
  getById: async (id: string): Promise<GetPostResponse> => {
    return apiService.get<GetPostResponse>(API.POST.GET_BY_ID(id));
  },

  /**
   * อัพเดทโพสต์
   * @param id - ID ของโพสต์
   * @param data - ข้อมูลที่ต้องการอัพเดท (title, content, tags)
   * @returns Promise<UpdatePostResponse>
   */
  update: async (id: string, data: UpdatePostRequest): Promise<UpdatePostResponse> => {
    return apiService.put<UpdatePostResponse>(API.POST.UPDATE(id), data);
  },

  /**
   * ลบโพสต์
   * @param id - ID ของโพสต์
   * @returns Promise<DeletePostResponse>
   */
  delete: async (id: string): Promise<DeletePostResponse> => {
    return apiService.delete<DeletePostResponse>(API.POST.DELETE(id));
  },

  /**
   * ดึงรายการโพสต์ทั้งหมด พร้อม pagination และ sorting
   * @param params - พารามิเตอร์ (offset, limit, sortBy)
   * @returns Promise<ListPostsResponse>
   */
  list: async (params?: GetPostsParams): Promise<ListPostsResponse> => {
    return apiService.get<ListPostsResponse>(API.POST.LIST, params);
  },

  /**
   * ดึงโพสต์ของผู้เขียนคนใดคนหนึ่ง
   * @param userId - ID ของผู้เขียน
   * @param params - พารามิเตอร์ (offset, limit, sortBy)
   * @returns Promise<ListPostsResponse>
   */
  getByAuthor: async (userId: string, params?: GetPostsParams): Promise<ListPostsResponse> => {
    return apiService.get<ListPostsResponse>(API.POST.BY_AUTHOR(userId), params);
  },

  /**
   * ดึงโพสต์ที่มี tag ระบุ
   * @param tagName - ชื่อ tag
   * @param params - พารามิเตอร์ (offset, limit, sortBy)
   * @returns Promise<ListPostsResponse>
   */
  getByTag: async (tagName: string, params?: GetPostsParams): Promise<ListPostsResponse> => {
    return apiService.get<ListPostsResponse>(API.POST.BY_TAG(tagName), params);
  },

  /**
   * ดึงโพสต์ที่มี tag ID ระบุ (เพื่อหลีกเลี่ยงปัญหา URL encoding กับ tag ภาษาไทย)
   * @param tagId - ID ของ tag
   * @param params - พารามิเตอร์ (offset, limit, sortBy)
   * @returns Promise<ListPostsResponse>
   */
  getByTagId: async (tagId: string, params?: GetPostsParams): Promise<ListPostsResponse> => {
    return apiService.get<ListPostsResponse>(API.POST.BY_TAG_ID(tagId), params);
  },

  /**
   * ค้นหาโพสต์
   * @param params - พารามิเตอร์การค้นหา (q, offset, limit, sortBy)
   * @returns Promise<SearchPostsResponse>
   */
  search: async (params: SearchPostsParams): Promise<SearchPostsResponse> => {
    return apiService.get<SearchPostsResponse>(API.POST.SEARCH, params);
  },

  /**
   * ดึง feed ส่วนตัว (personalized feed)
   * @param params - พารามิเตอร์ (offset, limit, sortBy)
   * @returns Promise<GetFeedResponse>
   */
  getFeed: async (params?: GetPostsParams): Promise<GetFeedResponse> => {
    return apiService.get<GetFeedResponse>(API.POST.FEED, params);
  },

  /**
   * สร้าง crosspost จากโพสต์เดิม
   * @param sourcePostId - ID ของโพสต์ต้นฉบับ
   * @param data - ข้อมูลเพิ่มเติม (title, content)
   * @returns Promise<CreateCrosspostResponse>
   */
  createCrosspost: async (
    sourcePostId: string,
    data: CreateCrosspostRequest
  ): Promise<CreateCrosspostResponse> => {
    return apiService.post<CreateCrosspostResponse>(API.POST.CREATE_CROSSPOST(sourcePostId), data);
  },

  /**
   * ดึงรายการ crossposts ทั้งหมดของโพสต์
   * @param postId - ID ของโพสต์
   * @param params - พารามิเตอร์ (offset, limit)
   * @returns Promise<GetCrosspostsResponse>
   */
  getCrossposts: async (postId: string, params?: GetPostsParams): Promise<GetCrosspostsResponse> => {
    return apiService.get<GetCrosspostsResponse>(API.POST.GET_CROSSPOSTS(postId), params);
  },
};

export default postService;
