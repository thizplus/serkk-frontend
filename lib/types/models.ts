/**
 * Data Models
 * Entity models returned from API
 */

import type {
  UserVote,
  MediaType,
  EncodingStatus,
  NotificationType,
  TargetType,
  UserRole,
} from './common';

/**
 * User Model
 */
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  karma: number;
  followersCount: number;
  followingCount: number;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Summary (for nested objects)
 */
export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

/**
 * User with Follow Status
 */
export interface UserWithFollowStatus extends User {
  isFollowing: boolean;
  followedAt?: string;
}

/**
 * Media Model
 */
export interface Media {
  id: string;
  type: MediaType;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail: string | null;
  width?: number;
  height?: number;
  duration?: number; // For videos

  // File-specific fields
  extension?: string; // For files (pdf, docx, zip, etc.)

  // Video streaming fields (Bunny Stream)
  videoId?: string; // Bunny Stream video ID
  encodingStatus?: EncodingStatus; // pending | processing | completed | failed
  encodingProgress?: number; // 0-100
  hlsUrl?: string; // HLS playlist URL (.m3u8) for adaptive streaming

  createdAt: string;
}

/**
 * Tag Model
 */
export interface Tag {
  id: string;
  name: string;
  postCount: number;
  createdAt?: string;
}

/**
 * Post Model
 */
export interface Post {
  id: string;
  title: string;
  content: string;
  author: UserSummary;
  votes: number;
  commentCount: number;
  media: Media[];
  tags: Tag[];
  sourcePost: PostSummary | null;
  createdAt: string;
  updatedAt: string;
  userVote: UserVote;
  isSaved: boolean;
  hotScore: number;
}

/**
 * Post Summary (for nested objects like sourcePost)
 */
export interface PostSummary {
  id: string;
  title: string;
  content: string;
  author: UserSummary;
  votes: number;
  commentCount: number;
  media?: Media[]; // Added for crosspost display
}

/**
 * Post with Saved Date
 */
export interface SavedPost extends Post {
  savedAt: string;
}

/**
 * Comment Model
 */
export interface Comment {
  id: string;
  content: string;
  postId: string;
  parentId: string | null;
  author: UserSummary;
  votes: number;
  replyCount: number;
  depth: number;
  parentChain: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userVote: UserVote;
  hotScore: number;
}

/**
 * Comment with Replies (Tree Structure)
 */
export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

/**
 * Comment with Post Info (for user's comments page)
 */
export interface CommentWithPost extends Comment {
  post: {
    id: string;
    title: string;
    author: UserSummary;
  };
}

/**
 * Vote Model
 */
export interface Vote {
  targetId: string;
  targetType: TargetType;
  voteType: UserVote;
  createdAt: string;
}

/**
 * Follow Model
 */
export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

/**
 * Saved Post Model
 */
export interface SavedPostRecord {
  userId: string;
  postId: string;
  createdAt: string;
}

/**
 * Notification Model
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  isRead: boolean;
  actorId?: string | null;
  actor?: UserSummary | null;
  sender?: UserSummary;  // Alternative field for actor from backend
  user?: UserSummary;    // Another alternative field for user from backend
  targetId?: string;
  targetType?: TargetType | null;
  link?: string;
  postId?: string;  // For notifications related to posts
  commentId?: string;  // For notifications related to comments
  createdAt: string;
}

/**
 * Notification Settings Model
 */
export interface NotificationSettings {
  userId: string;
  replies: boolean;
  votes: boolean;
  mentions: boolean;
  follows: boolean;
  emailNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Search History Model
 */
export interface SearchHistory {
  id: string;
  query: string;
  searchedAt: string;
}

/**
 * Popular Search Model
 */
export interface PopularSearch {
  query: string;
  count: number;
}

/**
 * Chat User Model
 */
export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
}

/**
 * Chat Message Media Model
 */
export interface ChatMessageMedia {
  url: string;
  thumbnail?: string | null;
  type: 'image' | 'video' | 'file';
  filename?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;

  // Video streaming fields (from Media model)
  videoId?: string;
  encodingStatus?: EncodingStatus;
  encodingProgress?: number;
  hlsUrl?: string;
  extension?: string;
}

/**
 * Chat Message Model
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  // Support both API response formats:
  senderId?: string;           // Simple format (our original type)
  sender?: User;                // API response format (includes full user object)
  receiver?: User;              // API response format
  type: 'text' | 'image' | 'video' | 'file';
  content: string | null;
  media?: ChatMessageMedia[];
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Last Message Summary
 */
export interface LastMessage {
  id: string;
  type: 'text' | 'image' | 'video' | 'file';
  content: string | null;
  senderId?: string; // Optional: Backend should send this for proper sender detection
  media?: ChatMessageMedia[]; // Optional: For showing media count
  mediaCount?: number; // Alternative: Just the count
  createdAt: string;
}

/**
 * Conversation Model
 */
export interface Conversation {
  id: string;
  otherUser: ChatUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

/**
 * Blocked User Model
 */
export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  blockedAt: string;
}
