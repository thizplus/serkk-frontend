/**
 * Response Types
 * API response structures
 */

import type { ApiResponse, PaginationMeta, UserVote } from './common';
import type {
  User,
  UserWithFollowStatus,
  Post,
  SavedPost,
  Comment,
  CommentWithReplies,
  CommentWithPost,
  Vote,
  Follow,
  Notification,
  NotificationSettings,
  Tag,
  SearchHistory,
  PopularSearch,
  Media,
  Conversation,
  ChatMessage,
  ChatUserSearchResult,
  BlockedUser,
  ChatMessageMedia,
} from './models';

/**
 * Authentication Responses
 */
export type RegisterResponse = ApiResponse<User>;

export type LoginResponse = ApiResponse<{
  token: string;
  user: User;
}>;

export type GoogleOAuthUrlResponse = ApiResponse<{
  url: string;
}>;

export type GoogleOAuthCallbackResponse = ApiResponse<{
  token: string;
  user: User;
  isNewUser: boolean;
  needsProfile: boolean;
}>;

/**
 * User Responses
 */
export type GetProfileResponse = ApiResponse<User>;

export type GetUserProfileResponse = ApiResponse<UserWithFollowStatus>;

export type UpdateProfileResponse = ApiResponse<User>;

export type DeleteUserResponse = ApiResponse<null>;

export type ListUsersResponse = ApiResponse<{
  users: User[];
  meta: PaginationMeta;
}>;

/**
 * Post Responses
 */
export type CreatePostResponse = ApiResponse<Post>;

export type GetPostResponse = ApiResponse<Post>;

export type UpdatePostResponse = ApiResponse<Post>;

export type DeletePostResponse = ApiResponse<null>;

export type ListPostsResponse = ApiResponse<{
  posts: Post[];
  meta: PaginationMeta;
}>;

export type SearchPostsResponse = ApiResponse<{
  posts: Post[];
  meta: PaginationMeta;
}>;

export type CreateCrosspostResponse = ApiResponse<Post>;

export type GetCrosspostsResponse = ApiResponse<{
  posts: Post[];
  meta: PaginationMeta;
}>;

export type GetFeedResponse = ApiResponse<{
  posts: Post[];
  meta: PaginationMeta;
}>;

/**
 * Comment Responses
 */
export type CreateCommentResponse = ApiResponse<Comment>;

export type GetCommentResponse = ApiResponse<Comment>;

export type UpdateCommentResponse = ApiResponse<Comment>;

export type DeleteCommentResponse = ApiResponse<null>;

export type ListCommentsResponse = ApiResponse<{
  comments: Comment[];
  meta: PaginationMeta;
}>;

export type ListCommentsByAuthorResponse = ApiResponse<{
  comments: CommentWithPost[];
  meta: PaginationMeta;
}>;

export type GetCommentRepliesResponse = ApiResponse<{
  comments: Comment[];
  meta: PaginationMeta;
}>;

export type GetCommentTreeResponse = ApiResponse<{
  comments: CommentWithReplies[];
}>;

export type GetCommentParentChainResponse = ApiResponse<{
  comments: Comment[];
}>;

/**
 * Vote Responses
 */
export type VoteResponse = ApiResponse<Vote>;

export type UnvoteResponse = ApiResponse<null>;

export type GetVoteResponse = ApiResponse<{
  voteType: UserVote;
  createdAt: string;
} | null>;

export type GetVoteCountResponse = ApiResponse<{
  targetId: string;
  targetType: string;
  voteCount: number;
}>;

export type GetUserVotesResponse = ApiResponse<{
  votes: Vote[];
  meta: PaginationMeta;
}>;

/**
 * Follow Responses
 */
export type FollowUserResponse = ApiResponse<Follow>;

export type UnfollowUserResponse = ApiResponse<null>;

export type GetFollowStatusResponse = ApiResponse<{
  isFollowing: boolean;
  followedAt: string | null;
}>;

export type GetFollowersResponse = ApiResponse<{
  users: UserWithFollowStatus[];
  meta: PaginationMeta;
}>;

export type GetFollowingResponse = ApiResponse<{
  users: UserWithFollowStatus[];
  meta: PaginationMeta;
}>;

export type GetMutualFollowsResponse = ApiResponse<{
  users: UserWithFollowStatus[];
  meta: PaginationMeta;
}>;

/**
 * Saved Post Responses
 */
export type SavePostResponse = ApiResponse<{
  userId: string;
  postId: string;
  createdAt: string;
}>;

export type UnsavePostResponse = ApiResponse<null>;

export type GetSavedStatusResponse = ApiResponse<{
  isSaved: boolean;
  savedAt: string | null;
}>;

export type GetSavedPostsResponse = ApiResponse<{
  posts: SavedPost[];
  meta: PaginationMeta;
}>;

/**
 * Notification Responses
 */
export type GetNotificationsResponse = ApiResponse<{
  notifications: Notification[];
  meta: PaginationMeta & { unreadCount: number };
}>;

export type GetUnreadNotificationsResponse = ApiResponse<{
  notifications: Notification[];
  meta: PaginationMeta & { unreadCount: number };
}>;

export type GetNotificationUnreadCountResponse = ApiResponse<{
  count: number;
}>;

export type GetNotificationResponse = ApiResponse<Notification>;

export type MarkNotificationAsReadResponse = ApiResponse<null>;

export type MarkAllAsReadResponse = ApiResponse<null>;

export type DeleteNotificationResponse = ApiResponse<null>;

export type DeleteAllNotificationsResponse = ApiResponse<null>;

export type GetNotificationSettingsResponse = ApiResponse<NotificationSettings>;

export type UpdateNotificationSettingsResponse = ApiResponse<NotificationSettings>;

/**
 * Tag Responses
 */
export type GetTagResponse = ApiResponse<Tag>;

export type ListTagsResponse = ApiResponse<{
  tags: Tag[];
  meta: PaginationMeta;
}>;

export type GetPopularTagsResponse = ApiResponse<{
  tags: Tag[];
}>;

export type SearchTagsResponse = ApiResponse<{
  tags: Tag[];
}>;

/**
 * Search Responses
 */
export type SearchAllResponse = ApiResponse<{
  query: string;
  posts: Post[];
  users: UserWithFollowStatus[];
  tags: Tag[];
}>;

export type SearchPostsOnlyResponse = ApiResponse<{
  query: string;
  posts: Post[];
}>;

export type SearchUsersOnlyResponse = ApiResponse<{
  query: string;
  users: UserWithFollowStatus[];
}>;

export type SearchTagsOnlyResponse = ApiResponse<{
  query: string;
  tags: Tag[];
}>;

export type SearchResponse =
  | SearchAllResponse
  | SearchPostsOnlyResponse
  | SearchUsersOnlyResponse
  | SearchTagsOnlyResponse;

export type GetPopularSearchesResponse = ApiResponse<{
  searches: PopularSearch[];
}>;

export type GetSearchHistoryResponse = ApiResponse<{
  history: SearchHistory[];
  meta: PaginationMeta;
}>;

export type ClearSearchHistoryResponse = ApiResponse<null>;

export type DeleteSearchHistoryItemResponse = ApiResponse<null>;

/**
 * Media Responses
 */
export type UploadImageResponse = ApiResponse<Media>;

export type UploadVideoResponse = ApiResponse<Media>;

export type UploadFileResponse = ApiResponse<Media>;

export type GetMediaResponse = ApiResponse<Media>;

export type GetUserMediaResponse = ApiResponse<{
  media: Media[];
  meta: PaginationMeta;
}>;

export type DeleteMediaResponse = ApiResponse<null>;

/**
 * Chat Responses
 */
export type GetConversationsResponse = ApiResponse<{
  conversations: Conversation[];
  meta: {
    hasMore: boolean;
    nextCursor?: string;
  };
}>;

export type GetConversationByUsernameResponse = ApiResponse<{
  conversation: Conversation;
}>;

export type SearchChatUsersResponse = ApiResponse<{
  users: ChatUserSearchResult[];
  suggested: ChatUserSearchResult[];
}>;

export type GetChatUnreadCountResponse = ApiResponse<{
  count: number;
}>;

export type GetMessagesResponse = ApiResponse<{
  messages: ChatMessage[];
  meta: {
    hasMore: boolean;
    nextCursor?: string;
  };
}>;

export type SendMessageResponse = ApiResponse<ChatMessage>;

export type MarkChatAsReadResponse = ApiResponse<{
  conversationId: string;
  readCount: number;
}>;

export type GetMessageResponse = ApiResponse<ChatMessage>;

export type GetMessageContextResponse = ApiResponse<{
  messages: ChatMessage[];
  targetIndex: number;
}>;

export type GetConversationMediaResponse = ApiResponse<{
  media: ChatMessageMedia[];
  meta: {
    hasMore: boolean;
    nextCursor?: string;
  };
}>;

export type BlockUserResponse = ApiResponse<{
  blockedUser: BlockedUser;
}>;

export type UnblockUserResponse = ApiResponse<null>;

export type GetBlockedUsersResponse = ApiResponse<{
  users: BlockedUser[];
}>;
