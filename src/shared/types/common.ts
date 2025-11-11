/**
 * Common Types
 * Shared types used across the application
 */

/**
 * API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string>; // Field validation errors
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  total: number;
  offset: number;
  limit: number;
  unreadCount?: number; // For notifications
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Pagination Query Parameters
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Sort Options
 */
export type SortBy = 'hot' | 'new' | 'top' | 'controversial';

/**
 * Vote Type
 * ใช้ "up" และ "down" ตาม backend spec
 * (backend validation: oneof=up down)
 */
export type VoteType = 'up' | 'down';

/**
 * User Vote Status (null = no vote)
 */
export type UserVote = VoteType | null;

/**
 * Media Type
 */
export type MediaType = 'image' | 'video' | 'file';

/**
 * Video Encoding Status
 */
export type EncodingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Notification Type
 */
export type NotificationType = 'reply' | 'vote' | 'mention' | 'follow';

/**
 * Target Type (for votes, etc.)
 */
export type TargetType = 'post' | 'comment';

/**
 * Search Type
 */
export type SearchType = 'all' | 'post' | 'user' | 'tag';

/**
 * User Role
 */
export type UserRole = 'user' | 'admin';

/**
 * Post Status
 * - draft: โพสต์ฉบับร่าง (ซ่อนจากสาธารณะ, มองเห็นได้เฉพาะเจ้าของ)
 * - published: โพสต์เผยแพร่แล้ว (มองเห็นได้ในฟีดสาธารณะ)
 */
export type PostStatus = 'draft' | 'published';
