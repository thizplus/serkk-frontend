// ============================================================================
// API Endpoint Constants
// Auto-generated from backend route specifications
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export const AUTH_API = {
  // Public endpoints
  REGISTER: '/auth/register',                      // POST /api/v1/auth/register
  LOGIN: '/auth/login',                            // POST /api/v1/auth/login
  GOOGLE: '/auth/google',                          // GET /api/v1/auth/google
  GOOGLE_CALLBACK: '/auth/google/callback',        // GET /api/v1/auth/google/callback (รับ GOOGLE_CODE จาก Google)
  EXCHANGE: '/auth/exchange',                      // POST /api/v1/auth/exchange (แลก OUR_CODE เป็น token)
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const USER_API = {
  // Public endpoints
  PROFILE: '/users/profile',                       // GET /api/v1/users/profile
  UPDATE_PROFILE: '/users/profile',                // PUT /api/v1/users/profile
  DELETE_ACCOUNT: '/users/profile',                // DELETE /api/v1/users/profile
  LIST: '/users',                                  // GET /api/v1/users
};

// ============================================================================
// POSTS
// ============================================================================

export const POST_API = {
  // Public endpoints
  LIST: '/posts',                                  // GET /api/v1/posts
  CREATE: '/posts',                                // POST /api/v1/posts
  GET_BY_ID: (id: string) => `/posts/${id}`,      // GET /api/v1/posts/:id
  UPDATE: (id: string) => `/posts/${id}`,         // PUT /api/v1/posts/:id
  DELETE: (id: string) => `/posts/${id}`,         // DELETE /api/v1/posts/:id

  // Post queries
  BY_AUTHOR: (userId: string) => `/posts/author/${userId}`,     // GET /api/v1/posts/author/:userId
  BY_TAG: (tagName: string) => `/posts/tag/${tagName}`,        // GET /api/v1/posts/tag/:tagName
  SEARCH: '/posts/search',                         // GET /api/v1/posts/search
  FEED: '/posts/feed',                             // GET /api/v1/posts/feed

  // Crosspost
  CREATE_CROSSPOST: (id: string) => `/posts/${id}/crosspost`,   // POST /api/v1/posts/:id/crosspost
  GET_CROSSPOSTS: (id: string) => `/posts/${id}/crossposts`,    // GET /api/v1/posts/:id/crossposts
};

// ============================================================================
// COMMENTS
// ============================================================================

export const COMMENT_API = {
  // Public endpoints
  CREATE: '/comments',                             // POST /api/v1/comments
  GET_BY_ID: (id: string) => `/comments/${id}`,   // GET /api/v1/comments/:id
  UPDATE: (id: string) => `/comments/${id}`,      // PUT /api/v1/comments/:id
  DELETE: (id: string) => `/comments/${id}`,      // DELETE /api/v1/comments/:id

  // Comment queries
  BY_POST: (postId: string) => `/comments/post/${postId}`,       // GET /api/v1/comments/post/:postId
  BY_AUTHOR: (userId: string) => `/comments/author/${userId}`,   // GET /api/v1/comments/author/:userId

  // Comment tree & replies
  POST_TREE: (postId: string) => `/comments/post/${postId}/tree`,  // GET /api/v1/comments/post/:postId/tree
  REPLIES: (id: string) => `/comments/${id}/replies`,            // GET /api/v1/comments/:id/replies
  TREE: (id: string) => `/comments/${id}/tree`,                  // GET /api/v1/comments/:id/tree
  PARENT_CHAIN: (id: string) => `/comments/${id}/parent-chain`,  // GET /api/v1/comments/:id/parent-chain
};

// ============================================================================
// VOTES
// ============================================================================

export const VOTE_API = {
  // Public endpoints
  CREATE: '/votes',                                // POST /api/v1/votes
  GET_USER_VOTES: '/votes/user',                   // GET /api/v1/votes/user

  // Vote queries
  GET: (targetType: 'post' | 'comment', targetId: string) =>
    `/votes/${targetType}/${targetId}`,            // GET /api/v1/votes/:targetType/:targetId
  DELETE: (targetType: 'post' | 'comment', targetId: string) =>
    `/votes/${targetType}/${targetId}`,            // DELETE /api/v1/votes/:targetType/:targetId
  GET_COUNT: (targetType: 'post' | 'comment', targetId: string) =>
    `/votes/${targetType}/${targetId}/count`,      // GET /api/v1/votes/:targetType/:targetId/count
};

// ============================================================================
// FOLLOWS
// ============================================================================

export const FOLLOW_API = {
  // Public endpoints
  MUTUALS: '/follows/mutuals',                     // GET /api/v1/follows/mutuals

  // Follow user
  FOLLOW: (userId: string) => `/follows/user/${userId}`,         // POST /api/v1/follows/user/:userId
  UNFOLLOW: (userId: string) => `/follows/user/${userId}`,       // DELETE /api/v1/follows/user/:userId
  STATUS: (userId: string) => `/follows/user/${userId}/status`,  // GET /api/v1/follows/user/:userId/status
  FOLLOWERS: (userId: string) => `/follows/user/${userId}/followers`,  // GET /api/v1/follows/user/:userId/followers
  FOLLOWING: (userId: string) => `/follows/user/${userId}/following`,  // GET /api/v1/follows/user/:userId/following
};

// ============================================================================
// SAVED POSTS
// ============================================================================

export const SAVED_API = {
  // Public endpoints
  LIST: '/saved/posts',                            // GET /api/v1/saved/posts

  // Save post
  SAVE: (postId: string) => `/saved/posts/${postId}`,       // POST /api/v1/saved/posts/:postId
  UNSAVE: (postId: string) => `/saved/posts/${postId}`,     // DELETE /api/v1/saved/posts/:postId
  STATUS: (postId: string) => `/saved/posts/${postId}/status`,  // GET /api/v1/saved/posts/:postId/status
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const NOTIFICATION_API = {
  // Public endpoints
  LIST: '/notifications',                          // GET /api/v1/notifications
  UNREAD: '/notifications/unread',                 // GET /api/v1/notifications/unread
  UNREAD_COUNT: '/notifications/unread/count',     // GET /api/v1/notifications/unread/count
  READ_ALL: '/notifications/read-all',             // PUT /api/v1/notifications/read-all
  DELETE_ALL: '/notifications',                    // DELETE /api/v1/notifications

  // Notification settings
  SETTINGS: '/notifications/settings',             // GET, PUT /api/v1/notifications/settings

  // Single notification
  GET_BY_ID: (id: string) => `/notifications/${id}`,      // GET /api/v1/notifications/:id
  MARK_READ: (id: string) => `/notifications/${id}/read`, // PUT /api/v1/notifications/:id/read
  DELETE: (id: string) => `/notifications/${id}`,         // DELETE /api/v1/notifications/:id
};

// ============================================================================
// TAGS
// ============================================================================

export const TAG_API = {
  // Public endpoints
  LIST: '/tags',                                   // GET /api/v1/tags
  POPULAR: '/tags/popular',                        // GET /api/v1/tags/popular
  SEARCH: '/tags/search',                          // GET /api/v1/tags/search
  GET_BY_ID: (id: string) => `/tags/${id}`,       // GET /api/v1/tags/:id
  GET_BY_NAME: (name: string) => `/tags/name/${name}`,  // GET /api/v1/tags/name/:name
};

// ============================================================================
// SEARCH
// ============================================================================

export const SEARCH_API = {
  // Public endpoints
  SEARCH: '/search',                               // GET /api/v1/search
  POPULAR: '/search/popular',                      // GET /api/v1/search/popular
  HISTORY: '/search/history',                      // GET /api/v1/search/history
  CLEAR_HISTORY: '/search/history',                // DELETE /api/v1/search/history
  DELETE_HISTORY_ITEM: (id: string) => `/search/history/${id}`,  // DELETE /api/v1/search/history/:id
};

// ============================================================================
// MEDIA
// ============================================================================

export const MEDIA_API = {
  // Public endpoints
  UPLOAD_IMAGE: '/media/upload/image',             // POST /api/v1/media/upload/image
  UPLOAD_VIDEO: '/media/upload/video',             // POST /api/v1/media/upload/video
  GET_BY_ID: (id: string) => `/media/${id}`,      // GET /api/v1/media/:id
  GET_BY_USER: (userId: string) => `/media/user/${userId}`,  // GET /api/v1/media/user/:userId
  DELETE: (id: string) => `/media/${id}`,         // DELETE /api/v1/media/:id
};

// ============================================================================
// COMBINED API OBJECT
// ============================================================================

export const API = {
  // Authentication & Authorization
  AUTH: AUTH_API,

  // User Management
  USER: USER_API,

  // Content
  POST: POST_API,
  COMMENT: COMMENT_API,

  // Interactions
  VOTE: VOTE_API,
  FOLLOW: FOLLOW_API,
  SAVED: SAVED_API,

  // Features
  NOTIFICATION: NOTIFICATION_API,
  TAG: TAG_API,
  SEARCH: SEARCH_API,
  MEDIA: MEDIA_API,
};

// ============================================================================
// EXPORTS
// ============================================================================

export { API_BASE_URL };
