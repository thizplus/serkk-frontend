/**
 * Request Types
 * Request payloads for API calls
 */

import type {
  PaginationParams,
  CursorPaginationParams,
  SortBy,
  VoteType,
  TargetType,
  SearchType,
} from './common';

/**
 * Authentication Requests
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User Requests
 */
export interface UpdateProfileRequest {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

/**
 * Post Requests
 */
export interface CreatePostRequest {
  // ✅ Phase 1: Idempotency fields (required for Optimistic UI)
  clientPostId?: string;      // Client-generated post ID for idempotency
  idempotencyKey?: string;    // Idempotency key for duplicate request prevention

  // Post content
  title: string;
  content: string;
  mediaIds?: string[];
  tags?: string[];
  sourcePostId?: string | null;
  isDraft?: boolean; // ระบุว่าต้องการสร้างเป็น draft หรือไม่ (optional - backend จะ auto-detect ถ้าไม่ระบุ)
}

export interface UpdatePostRequest {
  title: string;
  content: string;
  tags?: string[];
}

export interface CreateCrosspostRequest {
  title: string;
  content: string;
  tags?: string[];
}

/**
 * @deprecated Use GetPostsCursorParams instead
 */
export interface GetPostsParams extends PaginationParams {
  sortBy?: SortBy;
}

/** Cursor-based - NEW */
export interface GetPostsCursorParams extends CursorPaginationParams {
  sortBy?: SortBy;
  tag?: string;
}

export interface SearchPostsParams extends PaginationParams {
  q: string;
}

/**
 * Comment Requests
 */
export interface CreateCommentRequest {
  postId: string;
  parentId?: string | null;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

/**
 * @deprecated Use GetCommentsCursorParams instead
 */
export interface GetCommentsParams extends PaginationParams {
  sortBy?: SortBy;
}

/** Cursor-based - NEW */
export interface GetCommentsCursorParams extends CursorPaginationParams {
  sortBy?: SortBy;
}

export interface GetCommentTreeParams {
  maxDepth?: number;
}

/**
 * Vote Requests
 * ใช้ "up"/"down" ตาม backend validation
 */
export interface VoteRequest {
  targetId: string;
  targetType: TargetType;
  voteType: VoteType; // "up" หรือ "down"
}

export type GetUserVotesParams = PaginationParams;

/**
 * Follow Requests
 */
/**
 * @deprecated Use GetFollowersCursorParams instead
 */
export type GetFollowersParams = PaginationParams;

/** Cursor-based - NEW */
export type GetFollowersCursorParams = CursorPaginationParams;

/**
 * @deprecated Use GetFollowingCursorParams instead
 */
export type GetFollowingParams = PaginationParams;

/** Cursor-based - NEW */
export type GetFollowingCursorParams = CursorPaginationParams;

/**
 * @deprecated Use GetMutualFollowsCursorParams instead
 */
export type GetMutualFollowsParams = PaginationParams;

/** Cursor-based - NEW */
export type GetMutualFollowsCursorParams = CursorPaginationParams;

/**
 * Saved Post Requests
 */
/**
 * @deprecated Use GetSavedPostsCursorParams instead
 */
export type GetSavedPostsParams = PaginationParams;

/** Cursor-based - NEW */
export type GetSavedPostsCursorParams = CursorPaginationParams;

/**
 * Notification Requests
 */
/**
 * @deprecated Use GetNotificationsCursorParams instead
 */
export type GetNotificationsParams = PaginationParams;

/** Cursor-based - NEW */
export type GetNotificationsCursorParams = CursorPaginationParams;

export interface UpdateNotificationSettingsRequest {
  replies?: boolean;
  mentions?: boolean;
  votes?: boolean;
  follows?: boolean;
  emailNotifications?: boolean;
}

/**
 * Tag Requests
 */
export type GetTagsParams = PaginationParams;

export interface GetPopularTagsParams {
  limit?: number;
}

export interface SearchTagsParams {
  q: string;
  limit?: number;
}

/**
 * Search Requests
 */
export interface SearchParams {
  q: string;
  type?: SearchType;
  cursor?: string;  // ✅ เพิ่ม cursor สำหรับ pagination
  limit?: number;
}

export interface GetPopularSearchesParams {
  limit?: number;
}

export type GetSearchHistoryParams = PaginationParams;

/**
 * Media Requests
 */
export interface UploadImageRequest {
  image: File;
}

export interface UploadVideoRequest {
  video: File;
}

export type GetUserMediaParams = PaginationParams;

/**
 * Chat Requests
 */
export interface GetConversationsParams {
  cursor?: string;
  limit?: number;
}

export interface GetMessagesParams {
  cursor?: string;
  limit?: number;
}

export interface SendMessageRequest {
  type: 'text' | 'image' | 'video' | 'file';
  content?: string | null;
  media?: Array<{
    url: string;
    type: string;
    mediaId: string;
  }>;
}

export interface MarkAsReadRequest {
  // Empty - just POST to mark as read
}

export interface BlockUserRequest {
  username: string;
}

export interface UnblockUserRequest {
  username: string;
}
