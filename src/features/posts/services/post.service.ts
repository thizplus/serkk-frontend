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
  GetPostsCursorParams,
  SearchPostsParams,
  CreateCrosspostRequest,
} from '@/types/request';
import type {
  CreatePostResponse,
  GetPostResponse,
  UpdatePostResponse,
  DeletePostResponse,
  ListPostsResponse,
  ListPostsCursorResponse,
  SearchPostsResponse,
  CreateCrosspostResponse,
  GetCrosspostsResponse,
  GetCrosspostsCursorResponse,
  GetFeedResponse,
  GetFeedCursorResponse,
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
   * ดึงรายการโพสต์ทั้งหมด พร้อม cursor pagination และ sorting
   * @param params - พารามิเตอร์ (cursor, limit, sortBy)
   * @returns Promise<ListPostsCursorResponse>
   */
  list: async (params?: GetPostsCursorParams): Promise<ListPostsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.tag) queryParams.append('tag', params.tag);

    const queryString = queryParams.toString();
    const url = queryString ? `${API.POST.LIST}?${queryString}` : API.POST.LIST;

    return apiService.get<ListPostsCursorResponse>(url);
  },

  /**
   * ดึงโพสต์ของผู้เขียนคนใดคนหนึ่ง (Cursor-based)
   * @param userId - ID ของผู้เขียน
   * @param params - พารามิเตอร์ (cursor, limit, sortBy)
   * @returns Promise<ListPostsCursorResponse>
   */
  getByAuthor: async (userId: string, params?: GetPostsCursorParams): Promise<ListPostsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const queryString = queryParams.toString();
    const url = queryString ? `${API.POST.BY_AUTHOR(userId)}?${queryString}` : API.POST.BY_AUTHOR(userId);

    return apiService.get<ListPostsCursorResponse>(url);
  },

  /**
   * ดึงโพสต์ที่มี tag ระบุ (Cursor-based)
   * @param tagName - ชื่อ tag
   * @param params - พารามิเตอร์ (cursor, limit, sortBy)
   * @returns Promise<ListPostsCursorResponse>
   */
  getByTag: async (tagName: string, params?: GetPostsCursorParams): Promise<ListPostsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const queryString = queryParams.toString();
    const url = queryString ? `${API.POST.BY_TAG(tagName)}?${queryString}` : API.POST.BY_TAG(tagName);

    return apiService.get<ListPostsCursorResponse>(url);
  },

  /**
   * ดึงโพสต์ที่มี tag ID ระบุ (Cursor-based)
   * @param tagId - ID ของ tag
   * @param params - พารามิเตอร์ (cursor, limit, sortBy)
   * @returns Promise<ListPostsCursorResponse>
   */
  getByTagId: async (tagId: string, params?: GetPostsCursorParams): Promise<ListPostsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const queryString = queryParams.toString();
    const url = queryString ? `${API.POST.BY_TAG_ID(tagId)}?${queryString}` : API.POST.BY_TAG_ID(tagId);

    return apiService.get<ListPostsCursorResponse>(url);
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
   * ดึง feed ส่วนตัว (personalized feed) - Cursor-based
   * @param params - พารามิเตอร์ (cursor, limit, sortBy)
   * @returns Promise<GetFeedCursorResponse>
   */
  getFeed: async (params?: GetPostsCursorParams): Promise<GetFeedCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const queryString = queryParams.toString();
    const url = queryString ? `${API.POST.FEED}?${queryString}` : API.POST.FEED;

    return apiService.get<GetFeedCursorResponse>(url);
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
   * ดึงรายการ crossposts ทั้งหมดของโพสต์ (Cursor-based)
   * @param postId - ID ของโพสต์
   * @param params - พารามิเตอร์ (cursor, limit)
   * @returns Promise<GetCrosspostsCursorResponse>
   */
  getCrossposts: async (postId: string, params?: GetPostsCursorParams): Promise<GetCrosspostsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API.POST.GET_CROSSPOSTS(postId)}?${queryString}` : API.POST.GET_CROSSPOSTS(postId);

    return apiService.get<GetCrosspostsCursorResponse>(url);
  },
};

export default postService;
