/**
 * Request Types
 * Request payloads for API calls
 */

import type {
  PaginationParams,
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
  title: string;
  content: string;
  mediaIds?: string[];
  tags?: string[];
  sourcePostId?: string | null;
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

export interface GetPostsParams extends PaginationParams {
  sortBy?: SortBy;
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

export interface GetCommentsParams extends PaginationParams {
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
export type GetFollowersParams = PaginationParams;

export type GetFollowingParams = PaginationParams;

export type GetMutualFollowsParams = PaginationParams;

/**
 * Saved Post Requests
 */
export type GetSavedPostsParams = PaginationParams;

/**
 * Notification Requests
 */
export type GetNotificationsParams = PaginationParams;

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
